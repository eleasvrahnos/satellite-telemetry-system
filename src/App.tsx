// App.tsx  -  Houses the main application features

import { useEffect, useState } from "react";
import axios from "axios";
import DataSelection from "./components/DataSelection/DataSelection";
import DataTable from "./components/DataTable/DataTable";

function App() {
  const [seePastData, setSeePastData] = useState<boolean>(false); // useState for seePastData, format bool
  const [currData, setCurrData] = useState<any[]>([]); // useState for currData, format 2D array
  const [seeTable, setSeeTable] = useState<boolean>(false); // useState for seeTable, format bool
  const [liveFeed, setLiveFeed] = useState<any[]>([]); // useState for liveFeed, format 2D array
  const [seeLiveTable, setSeeLiveTable] = useState<boolean>(false); // useState for seeLiveTable, format bool

  // Submits the API request with the given parameters and populates the table with the result
  const handleFormSubmit = async (
    satelliteID: string,
    startDate: Date | null,
    endDate: Date | null
  ) => {
    try {
      const url = satelliteID // Depends on whether satelliteID is defined
        ? `telemetry/satellite/${satelliteID}`
        : `telemetry/satellite`;
      const params: { start?: string; end?: string } = {};

      // Add start and end dates to the params if they are defined
      if (startDate) {
        params.start = startDate.toISOString(); // Convert to RFC3339 format
      }
      if (endDate) {
        params.end = endDate.toISOString(); // Convert to RFC3339 format
      }

      // Make the API request
      const response = await axios.get(url, { params });
      const tableData = response.data;

      // Show the prepared table and turn off everything else
      setCurrData(tableData);
      setSeePastData(false);
      setSeeTable(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // WebSocket connection for live feed - https://stackoverflow.com/questions/60152922/proper-way-of-using-react-hooks-websockets
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8765");

    // Confirmation of socket opening successfully
    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    // Socket received data that was inputted into database (Database ID is not included)
    socket.onmessage = (event) => {
      const liveData = event.data.split(":"); // Deconstruct encoding method of concatenating with colons
      const dataArray = liveData.slice(0, -1).map((segment: string) => { // Leave out the last colon
        const data: number[] = segment.split(",").map(Number); // Turn each section into an array separated by commas
        const now = new Date().toISOString(); // Get current timestamp in RFC3339 format
        return {
          Timestamp: now,
          SatelliteID: data[0],
          Temperature: data[1],
          BatteryVoltage: data[2],
          Altitude: data[3],
        };
      });
      setLiveFeed((prev) => [...prev, ...dataArray]); // Append new data to live feed
    };

    // Confirmation of socket closing successfully (happens when server.py stops)
    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socket.close();
    };
  }, []); // No dependencies so that data is updated on every render

  return (
    <div className="flex justify-center flex-col items-center">
      <div className="text-5xl black font-bold mt-10">
        Satellite Telemetry Simulation
      </div>
      <div className="flex gap-10 justify-center pt-10">
        <button
          onClick={() => { // Make only live table visible
            setSeePastData(false);
            setSeeTable(false);
            setSeeLiveTable(true);
          }}
          className="border-black rounded-md border-2 px-5 py-2 hover:bg-black hover:text-white transition duration-150"
        >
          Live Feed
        </button>
        <button
          onClick={() => { // Make only past data table visible
            setSeePastData(true);
            setSeeTable(false);
            setSeeLiveTable(false);
          }}
          className="border-black rounded-md border-2 px-5 py-2 hover:bg-black hover:text-white transition duration-150"
        >
          See Past Data
        </button>
      </div>
      <div className="my-10">
        {seePastData && <DataSelection onSubmit={handleFormSubmit} />}
        {seeTable && <DataTable data={currData} live={false} />}
        {seeLiveTable && <h2 className="font-bold flex justify-center">Live Feed Generating...</h2>}
        {liveFeed.length > 0 && seeLiveTable && <DataTable data={liveFeed} live={true} />}
      </div>
    </div>
  );
}

export default App;
