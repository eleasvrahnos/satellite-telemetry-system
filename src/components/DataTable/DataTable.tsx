// DataTable.tsx  -  A table component that presents a general form for the data table displayed

import React from 'react';

// Defines TelemetryData interface (attributes for each row)
interface TelemetryData {
  ID: number;
  Timestamp: string;
  SatelliteID: number;
  Temperature: number;
  BatteryVoltage: number;
  Altitude: number;
}

// Defines DataTableProps interface (contains an array of TelemetryData-type rows)
interface DataTableProps {
  data: TelemetryData[];
  live: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ data, live }) => {    
  return (
    <table className="min-w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          { !live && <th className="border border-gray-300 px-4 py-2">ID</th>}
          <th className="border border-gray-300 px-4 py-2">Timestamp</th>
          <th className="border border-gray-300 px-4 py-2">Satellite ID</th>
          <th className="border border-gray-300 px-4 py-2">Temperature</th>
          <th className="border border-gray-300 px-4 py-2">Battery Voltage</th>
          <th className="border border-gray-300 px-4 py-2">Altitude</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            { !live && <td className="border border-gray-300 px-4 py-2">{row.ID}</td>}
            <td className="border border-gray-300 px-4 py-2">{row.Timestamp}</td>
            <td className="border border-gray-300 px-4 py-2">{row.SatelliteID}</td>
            <td className={`border border-gray-300 px-4 py-2 ${(row.Temperature > 50 || row.Temperature < -50) && "bg-red-400"}`}>{row.Temperature}</td>
            <td className={`border border-gray-300 px-4 py-2 ${row.BatteryVoltage > 50 && "bg-red-400"}`}>{row.BatteryVoltage}</td>
            <td className={`border border-gray-300 px-4 py-2 ${row.Altitude > 350 && "bg-red-400"}`}>{row.Altitude}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
