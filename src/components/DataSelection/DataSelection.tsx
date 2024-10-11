// DataSelection.tsx  -  A form component that requests the user for a satellite ID and start/end date

import React, { useState } from "react";
import DatePicker from "react-datepicker"; // https://www.npmjs.com/package/react-datepicker
import "react-datepicker/dist/react-datepicker.css";

// Defines DataSelectionProps interface (possible things to query)
interface DataSelectionProps {
  onSubmit: (
    satelliteID: string,
    startDate: Date | null,
    endDate: Date | null
  ) => void;
}

const DataSelection: React.FC<DataSelectionProps> = ({ onSubmit }) => {
  const [satelliteID, setSatelliteID] = useState<string>(""); // useState for satelliteID field, format string
  const [startDate, setStartDate] = useState<Date | null>(null); // useState for startDate field, format Date
  const [endDate, setEndDate] = useState<Date | null>(null); // useState for endDate field, format Date
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Stops page refresh
    
    // Check if satelliteID is a valid integer (if defined)
    if (satelliteID) {
      const integerID = parseInt(satelliteID, 10); // Attempt to convert the type to integer
        if (isNaN(integerID) || integerID <= 0) { // Check if it's a valid positive integer
            alert("Please enter a valid positive integer for Satellite ID.");
            return;
        }
    }

    // Check if startDate is before endDate (if both are selected)
    if (startDate && endDate && startDate >= endDate) {
      alert("Start date must be before end date.");
      return;
    }
    onSubmit(satelliteID, startDate, endDate);
  };

  return (
    <form
      className="border-black border-2 p-5 flex justify-center flex-col gap-5"
      onSubmit={handleSubmit}
    >
      <div>
        <h1>Satellite ID (Leave blank for all satellites):</h1>
        <input
          type="text"
          className="border-2 border-black w-full p-2"
          value={satelliteID}
          onChange={(e) => setSatelliteID(e.target.value)}
          placeholder="Enter satellite ID"
        />
      </div>

      <div>
        <h1>Timestamp range:</h1>
        <label className="flex flex-col">
          Start Date and Time (if blank, will start with beginning entry):
          <DatePicker
            selected={startDate}
            className="border-2 border-black w-full p-2"
            onChange={(date: Date | null) => setStartDate(date)}
            showTimeSelect
            dateFormat="yyyy-MM-dd h:mm aa"
            timeFormat="HH:mm"
            isClearable
            placeholderText="Select start date and time"
          />
        </label>
        <br />
        <label className="flex flex-col">
          End Date and Time (if blank, will end with last entry):
          <DatePicker
            selected={endDate}
            className="border-2 border-black w-full p-2"
            onChange={(date: Date | null) => setEndDate(date)}
            showTimeSelect
            dateFormat="yyyy-MM-dd h:mm aa"
            timeFormat="HH:mm"
            isClearable
            placeholderText="Select end date and time"
          />
        </label>
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default DataSelection;
