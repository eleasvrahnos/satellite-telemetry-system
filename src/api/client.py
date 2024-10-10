# client.py  -  Generates random telemetry data to be captured by server.py

import random
import socket
import struct
import time

# CSP header is packed into 3 bytes:
# - priority (2 bits) + destination (6 bits) are packed into 1st byte (B)
# - source (6 bits) + reserved (2 bits) are packed into 2nd byte (B)
# - port (6 bits) + hmac (1 bit) + rdp (1 bit) are packed into 3rd byte (B)
# Then telemetry data:
# - satelliteID (uint32, 4 bytes)
# - temperature (float, 4 bytes)
# - batteryVoltage (float, 4 bytes)
# - altitude (float, 4 bytes)

# CSP header fields packed into 3 bytes
# Telemetry data uses 16 bytes
csp_telemetry_format = (
    "B B B I f f f"
)

# Generate random CSP header and telemetry data
def generate_random_telemetry():
    priority = random.randint(0, 3)  # 2 bits for priority
    destination = random.randint(0, 63)  # 6 bits for destination address
    source = random.randint(0, 63)  # 6 bits for source address
    reserved = 0  # 2 bits to be reserved
    port = random.randint(0, 63)  # 6 bits for destination port
    hmac = random.randint(0, 1)  # 1 bit HMAC flag
    rdp = random.randint(0, 1)  # 1 bit RDP flag

    # Merge into 3 bytes (B format in struct)
    header_byte1 = (priority << 6) | destination  # Contains priority (2 bits) and destination (6 bits) 
    header_byte2 = (source << 2) | reserved  # Contains source (6 bits) and reserved (2 bits)
    header_byte3 = (port << 2) | (hmac << 1) | rdp  # Contains port (6 bits), hmac (1 bit), and rdp (1 bit)

    # Random telemetry data
    satellite_id = random.randint(1000, 9999)  # uint32 (4 bytes)
    temperature = random.uniform(-100.0, 100.0)  # float (4 bytes)
    battery_voltage = random.uniform(0.0, 100.0)  # float (4 bytes)
    altitude = random.uniform(200.0, 400.0)  # float (4 bytes)

    return (
        header_byte1,
        header_byte2,
        header_byte3,
        satellite_id,
        temperature,
        battery_voltage,
        altitude
    )

# Sends random CSP header and telemetry data to a specified socket and port
def send_csp_telemetry_packet(sock, port, address):
    while True:
        csp_telemetry_data = generate_random_telemetry()  # Get randomly-generated packet data (header and telemetry)
        packet = struct.pack(csp_telemetry_format, *csp_telemetry_data)  # Pack it via struct.pack(format separated by spaces, data separated by spaces)
        sock.sendto(packet, address)  # Send the packet via a socket with a given IP and Port address
        print(f"Sent CSP telemetry on Port {port}: {csp_telemetry_data}")  # Printing confirmation of sent data from specified port
        time.sleep(random.uniform(0, 1))  # Delay to simulate real-time telemetry


# Set up UDP socket
udp_ip = "127.0.0.1"
udp_port = 5005  # Specify port of satellite here (from possible sample ports listed in server.py)
client_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Start sending telemetry
send_csp_telemetry_packet(client_sock, udp_port, (udp_ip, udp_port))