// App.tsx  -  Houses the main application features

import { useState } from "react";
import axios from "axios";
import DataSelection from "./components/DataSelection/DataSelection";
import DataTable from "./components/DataTable/DataTable";

function App() {
  const [seePastData, setSeePastData] = useState<boolean>(false); // useState for seePastData, format bool
  const [currData, setCurrData] = useState<any[]>([]); // useState for currData, format 2D array
  const [seeTable, setSeeTable] = useState<boolean>(false); // useState for seeTable, format bool

  // Submits the API request with the given parameters and populates the table with the result
  const handleFormSubmit = async (
    satelliteID: string,
    startDate: Date | null,
    endDate: Date | null
  ) => {
    try {
      const url = satelliteID
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

      setCurrData(tableData);
      setSeePastData(false);
      setSeeTable(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="flex justify-center flex-col items-center">
      <div className="text-5xl black font-bold mt-10">
        Satellite Telemetry Simulation
      </div>
      <div className="flex gap-10 justify-center pt-10">
        <button className="border-black rounded-md border-2 px-5 py-2 hover:bg-black hover:text-white transition duration-150">
          Live Feed
        </button>
        <button
          onClick={() => {
            setSeePastData(true);
            setSeeTable(false);
          }}
          className="border-black rounded-md border-2 px-5 py-2 hover:bg-black hover:text-white transition duration-150"
        >
          See Past Data
        </button>
      </div>
      <div className="my-10">
        {seePastData && <DataSelection onSubmit={handleFormSubmit} />}
        {seeTable && <DataTable data={currData} />}
      </div>
    </div>
  );
}

export default App;
