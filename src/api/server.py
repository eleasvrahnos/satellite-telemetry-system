# server.py  -  Captures the random telemetry data sent by client.py

import socket
import struct
from psycopg2 import pool
import time
import os
from dotenv import load_dotenv
import websockets
import asyncio

# CSP header fields packed into 3 bytes
# Telemetry data uses 16 bytes
csp_telemetry_format = ( "B B B I f f f" )
# Sample ports to listen to (emulates different satellites)
satellite_ports = [5005, 5006, 5007]
# Create the connection pool using environment variables (used to reduce the number of connections and disconnections occurring)
load_dotenv()
connStr = f"dbname={os.environ['DB_NAME']} user={os.environ['USER']} password={os.environ['PASSWORD']} host={os.environ['HOST']} port={os.environ['PORT']}"
connection_pool = pool.SimpleConnectionPool(minconn=1, maxconn=20, dsn=connStr)
# Prepare the insert query
database_insert_query = """INSERT INTO telemetry (satellite_id, temperature, battery_voltage, altitude) VALUES (%s, %s, %s, %s)"""
# Set to hold connected WebSocket clients
connected_clients = set()

# Connect incoming websocket connections to list of clients
async def websocket_handler(websocket):
    connected_clients.add(websocket)
    try:
        await websocket.wait_closed()  # Keep websocket in use until closed
    finally:
        connected_clients.remove(websocket)

# Attempt a connection to the database
async def database_insert(batch_data):
    conn = connection_pool.getconn()  # Uses an available connection within the pool
    try:  # try / except / finally blocks used to catch possible errors
        with conn.cursor() as cursor:
            cursor.executemany(database_insert_query, batch_data)  # Inserts the given batch data using the prepared query
        conn.commit()  # Saves the changes to the database table
        print("Record inserted successfully into database.")  # Printing confirmation that the data was successfully added

        # Notify all connected WebSocket clients about the new data
        # My special encoding: concatenate data with commas, and concatenate each set with colons (extra colon on end to be removed)
        sent_data = [f"{data[0]},{data[1]},{data[2]},{data[3]}:" for data in batch_data]
        # Send the data to each client connected
        for client in connected_clients:
            await client.send(sent_data)
    except Exception as e:  # Catches all possible errors
        print(f"Database insertion error: {e}")
        conn.rollback()  # Rollback to previous state in case of error
    finally:
        connection_pool.putconn(conn)  # Returns connection for future queries to use within the pool


# Receives random CSP header and telemetry data from a specified socket and port
async def capture_csp_telemetry_packet(sock, port, batch_size=10, flush_interval=10): # Increase batch size for larger-scale implementation

    batch_data = []  # List to accumulate telemetry data
    last_flush_time = time.time()  # Track the last time we flushed the batch

    while True:
        data, addr = sock.recvfrom(32)  # Read from the given socket with a buffer size of 32 (minimizing overhead due to receiving 19-byte packets)
        csp_telemetry_data = struct.unpack(csp_telemetry_format, data)  # Unpack it via struct.pack(format separated by spaces, data)
        print(f"Received from address {addr} on Port {port}: {csp_telemetry_data}")  # Printing confirmation that data has been received on a specified port
        
        satellite_id = csp_telemetry_data[3]  # Extract satellite ID
        temperature = csp_telemetry_data[4]  # Extract temperature
        battery_voltage = csp_telemetry_data[5]  # Extract battery voltage
        altitude = csp_telemetry_data[6]  # Extract altitude
        
         # Accumulate telemetry data
        batch_data.append((satellite_id, temperature, battery_voltage, altitude))

         # Check if we should insert the batch (batch size met or flush time interval passed)
        if len(batch_data) >= batch_size or (time.time() - last_flush_time >= flush_interval):
            await database_insert(batch_data)  # Insert accumulated data into database table
            batch_data.clear()  # Clear the batch after insertion
            last_flush_time = time.time()  # Reset the flush time

# In order to allow multiple UDP ports to be read, a socket will be set up to each specified port to read all of the ports' data
def start_port_listener(port):
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  # Create server socket
    server_sock.bind(("127.0.0.1", port))  # Bound to allow reading only from the specified port
    print(f"Listening for telemetry on port {port}...")  # Printing confirmation that the specified port is ready to be read from

    # Run coroutine for each port and capture packets
    asyncio.run(capture_csp_telemetry_packet(server_sock, port))

# Start WebSocket server and port listeners
async def main():
    start_server = websockets.serve(websocket_handler, "localhost", 8765)
    
    async with start_server:
        # Create threads for each port
        await asyncio.gather(*[asyncio.to_thread(start_port_listener, port) for port in satellite_ports])

# Run event loop
if __name__ == "__main__":
    asyncio.run(main())