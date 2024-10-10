# Satellite Telemetry System - Eleas Vrahnos

In this task, I have implemented all 5 steps outlined. Below, I have outlined my thought process and implementation strategies for each step.
Included are the bonus tasks of containerization and implementing telemetry reading from multiple UDP ports.

## Step 1: Sending Satellite Telemetry Packets Over UDP

I have decided to go with the given struct outline as a starting point, but there was a bug with sending the header data. Not all of the information was being sent through as header data (26 bits trying to be packed into 2 bytes), so I modified the given constraints slightly to allow for all of the data to be sent. This is the new struct outline for the data (telemetry data was unchanged):

- CSP header is packed into 3 bytes:
  - priority (2 bits) + destination (6 bits) are packed into 1st byte (B)
  - source (6 bits) + reserved (2 bits) are packed into 2nd byte (B)
  - port (6 bits) + hmac (1 bit) + rdp (1 bit) are packed into 3rd byte (B)
- Telemetry data:
  - satelliteID (uint32, 4 bytes)
  - temperature (float, 4 bytes)
  - batteryVoltage (float, 4 bytes)
  - altitude (float, 4 bytes)

This code is located in ``client.py``, and combined with Step 2, will be able to send over data to ``server.py``. To support the **bonus task** of receiving data from multiple UDP ports, multiple instances of the ``client.py`` can be run (with different ports for ``udp_port``) to simulate this.

## Step 2: Telemetry Ingestion Service

For this step, I have created a new file, ``server.py``, to allow intaking all data sent through to a server socket. To support the **bonus task** of receiving data from multiple UDP ports, the file creates a thread for each of the ports (in the sample implementation, 3 threads) and listens for any data sent through any of the ports, while noting what port (satellite) the data came from.

I realize how multithreading would affect scalability and efficiency and how it would compare to other methods, like single-thread event loops using ``asyncio``. I know multithreading can be optimized on, since its eventual resource overhead and blocking calls could affect the hypothetical "million packets a second" scenario. Using a single-thread event loop would help solve this problem, but I have chosen to stick with multithreading for my implementation. Some reasons are listed below:

- I have better knowledge of multithreading and how it works, and so can control/maintain it more effectively.
- I followed the simple socket implementation given in the ``client.py`` boilerplate code, since ``asyncio`` uses in-built sockets.
- Although I have used ``asyncio`` before, I have limited knowledge of how it could be implemented in this case, and didn't have enough time to learn enough and refactor my code.

If I had more time with this project, I would look to revising my implementation with ``asyncio``, a method that would reduce overhead and ultimately decrease possible reading blockers or errors.

To counteract this setback, I have made some design choices that can help affect readability and performance, including:

- Limiting the reading buffer size to 32 bytes (from a standard of 1028 bytes) to account for the fact that only 19 bytes are sent.
- Specifying the port and address that each set of data is received from for logging purposes.

## Step 3: Storing Telemetry in a Database

For the database, I have decided to go ahead and pick up some PostgreSQL knowledge. Using it is not too different from the SQL methods that I already know, so I was able to pick it up relatively quickly.

I have created a database called ``telemetry_data``, with the table ``telemetry`` to hold the data obtained by the server. Below is an example entry within the table.

| id (int) | timestamp (timestamp)      | satellite_id (int) | temperature (float) | battery_voltage (float) | altitude (float)   |
| ---      | ---                        | ---                | ---                 | ---                     | ---                |
| 1        | 2024-10-08 15:48:36.376204 | 8516               | -72.08430480957031  | 14.19101333618164       | 394.31524658203125 |

Each row entered into the table contains an entry ID (a unique primary key), a timestamp indicating when the entry was added, and the 4 important data points for that entry. The CSP header information is not included, as that data is not as relevant for the database and is mainly for checking the information and validity of the packet itself. If there are additional operations to be done with the CSP header information, they can similarly be extracted within ``capture_csp_telemetry_packet``.

For efficiency and scalability, the following have been implemented:
- Database connection is done through a connection pool, so that a connection/disconnection doesn't happen for every query. This means that connections can be kept open and reused by future queries, reducing connection overhead.
- The insert query used to insert data into the table will be in the same format, so a prepared query is used. This way, a new query is not created for every insert, reducing insert time.
- In conjunction with the prepared query, batch insertion is also used to insert data using less insert queries. This allows for a collection of data samples to accumulate before passing it through the query. A flush time interval is also noted, to ensure that the accumulated data is flushed out within a specified time interval.
    - There is a trade-off here, since batch insertion uses a local array to accumulate the data, which may lead to local memory overhead depending on the situation. However, I have opted to implement batch insertion, because I made the decision that the benefits of getting data efficiently outweighed using extra memory. The batch size is specified by the user too, so the array will store that amount of data at a maximum, and the minimal memory overhead can therefore still be controlled.
- Since Step 4 has operators querying by satellite ID and timestamps often, I have created indexes for both the ``satellite_id`` and ``timestamp`` columns, which will make querying by those columns faster.

## Step 4: TBC