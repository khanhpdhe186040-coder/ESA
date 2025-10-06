import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default function TeachingSchedule() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [slots, setSlots] = useState([]);
    const [weekdays, setWeekdays] = useState([]);
    const [loading, setLoading] = useState(false);

    // Generate all weeks for a given year
    const generateWeeksOfYear = (targetYear) => {
        const startDate = new Date(`${targetYear}-01-01`);
        // Adjust to get the first Monday of the year
        while (startDate.getDay() !== 1) {
            startDate.setDate(startDate.getDate() + 1);
        }

        const weeks = [];
        for (let i = 0; i < 53; i++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(startDate.getDate() + i * 7);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            // Stop if week starts in next year and it's not the first week of that year
            if (weekStart.getFullYear() > targetYear && i > 0) break;

            const label = `${weekStart.toLocaleDateString('en-GB')} To ${weekEnd.toLocaleDateString('en-GB')}`;
            weeks.push({
                label,
                start: new Date(weekStart),
                end: new Date(weekEnd),
            });
        }
        return weeks;
    };

    // Function to get week dates from selected week
    const getWeekDatesFromSelectedWeek = (selectedWeek) => {
        if (!selectedWeek) return [];

        const weekDates = [];
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const targetDays = [1, 2, 3, 4, 5, 6, 0]; // Monday=1, Tuesday=2, ..., Sunday=0

        for (let i = 0; i < 7; i++) {
            const date = new Date(selectedWeek.start);
            date.setDate(selectedWeek.start.getDate() + i);

            weekDates.push({
                label: dayNames[i],
                targetDay: targetDays[i],
                date: date.toISOString().split('T')[0] // Format as YYYY-MM-DD
            });
        }

        return weekDates;
    };

    // Function to format week range for display
    const getWeekRange = (weekDates) => {
        if (weekDates.length === 0) return "";

        const firstDate = new Date(weekDates[0].date);
        const lastDate = new Date(weekDates[6].date);

        const formatDate = (date) => {
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        };

        return `Week of ${formatDate(firstDate)} - ${formatDate(lastDate)}`;
    };

    // Fetch schedule data
    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No token found in localStorage");
                return;
            }
            const teacherId = jwtDecode(token).id;
            console.log("Fetching schedule for teacher ID:", teacherId);
            const response = await axios.get(`http://localhost:9999/api/teacher/${teacherId}/schedules`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                setSchedule(response.data.data);
            } else {
                console.error("Unexpected schedule response structure:", response.data);
                setSchedule([]);
            }
        } catch (error) {
            console.error("Error fetching schedule:", error);
            setSchedule([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch slots data
    const fetchSlots = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:9999/api/teacher/slots', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                setSlots(response.data.data);
            } else {
                console.error("Unexpected slots response structure:", response.data);
                setSlots([]);
            }
        } catch (error) {
            console.error("Error fetching slots:", error);
            setSlots([]);
        }
    };

    // Effect to generate weeks when year changes
    useEffect(() => {
        const newWeeks = generateWeeksOfYear(year);
        setWeeks(newWeeks);

        // Find current week instead of selecting first week
        const currentDate = new Date();
        const currentWeek = newWeeks.find(week => {
            // Reset time to midnight for accurate date comparison
            const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const weekStart = new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate());
            const weekEnd = new Date(week.end.getFullYear(), week.end.getMonth(), week.end.getDate());

            return currentDateOnly >= weekStart && currentDateOnly <= weekEnd;
        });

        setSelectedWeek(currentWeek || (newWeeks.length > 0 ? newWeeks[0] : null));

        console.log("Generated weeks:", newWeeks);
        console.log("Current date:", currentDate);
        console.log("Selected current week:", currentWeek || newWeeks[0]);
    }, [year]);

    // Effect to update weekdays when selected week changes
    useEffect(() => {
        if (selectedWeek) {
            const weekDates = getWeekDatesFromSelectedWeek(selectedWeek);
            setWeekdays(weekDates);
        }
    }, [selectedWeek]);

    // Effect to fetch initial data
    useEffect(() => {
        fetchSlots();
        fetchSchedule();
    }, []);

    // Effect to refresh schedule when selectedWeek changes (optional - for real-time updates)
    useEffect(() => {
        if (selectedWeek) {
            fetchSchedule();
        }
    }, [selectedWeek]);

    // Set up auto-refresh every 30 seconds for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            console.log("Auto-refreshing schedule data...");
            fetchSchedule();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    // Add manual refresh button functionality
    const handleRefresh = () => {
        fetchSchedule();
    };

    // Group schedule items by slot ID and filter by selected week
    const groupedSchedule = {};
    if (Array.isArray(schedule) && selectedWeek) {
        console.log("Selected week:", selectedWeek);
        console.log("All schedule items:", schedule);

        // Filter schedule items to only include those in the selected week
        const filteredSchedule = schedule.filter(item => {
            const itemDate = new Date(item.date);
            const isInWeek = itemDate >= selectedWeek.start && itemDate <= selectedWeek.end;
            console.log(`Item date: ${item.date}, In selected week: ${isInWeek}`);
            return isInWeek;
        });

        console.log("Filtered schedule for selected week:", filteredSchedule);

        // Group the filtered schedule by slot ID
        filteredSchedule.forEach(item => {
            const slotId = item.slot.id;
            if (!groupedSchedule[slotId]) {
                groupedSchedule[slotId] = [];
            }
            groupedSchedule[slotId].push(item);
        });
    }

    return (
        <div>
            <div className="w-full p-8 bg-gray-50 min-h-screen">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Teaching Schedule</h2>
                        <p className="text-gray-500">{getWeekRange(weekdays)}</p>
                    </div>
                    {/* Add refresh button */}
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {/* Week Selection Controls */}
                <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow">
                    <label className="text-sm font-semibold text-gray-700">YEAR:</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(+e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {[2023, 2024, 2025, 2026, 2027].map(yearOption => (
                            <option key={yearOption} value={yearOption}>{yearOption}</option>
                        ))}
                    </select>

                    <label className="text-sm font-semibold text-gray-700">WEEK:</label>
                    <select
                        value={selectedWeek?.label || ""}
                        onChange={(e) => {
                            const week = weeks.find((w) => w.label === e.target.value);
                            setSelectedWeek(week);
                        }}
                        className="border border-gray-300 px-3 py-2 rounded text-sm max-w-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {weeks.map((week) => (
                            <option key={week.label} value={week.label}>
                                {week.label}
                            </option>
                        ))}
                    </select>

                    {selectedWeek && (
                        <span className="text-sm text-blue-600 font-medium">
                            ({selectedWeek.start.toDateString()} - {selectedWeek.end.toDateString()})
                        </span>
                    )}
                </div>

                <div className="rounded-lg shadow-lg">
                    <table className="max-w-full min-w-[600px] bg-white shadow-md border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                <th rowSpan={2} className="py-3 px-4 text-center border border-gray-200">Time</th>
                                {weekdays.map(day => (
                                    <th
                                        key={day.label}
                                        className="py-3 px-4 text-center border border-gray-200 w-[150px]"
                                    >
                                        {day.label}
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                {weekdays.map(day => (
                                    <th
                                        key={day.label}
                                        className="py-3 px-4 text-center border border-gray-200 w-[150px]"
                                    >
                                        {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {loading && (
                                <tr>
                                    <td colSpan={8} className="text-center py-4">
                                        Loading schedule...
                                    </td>
                                </tr>
                            )}
                            {!loading && slots.map((slot, index) => {
                                const slotId = slot._id;
                                const itemsForSlot = groupedSchedule[slotId] || [];
                                return (
                                    <tr key={slotId} className="border-b last:border-none">
                                        <td className="py-4 px-4 font-semibold text-gray-500 border border-gray-200">
                                            <div className="text-lg text-gray-800 text-center">Slot {index + 1}</div>
                                            <div className="text-center">{slot.from} - {slot.to}</div>
                                        </td>
                                        {weekdays.map(day => {
                                            const scheduleForDay = itemsForSlot.find(item => {
                                                const itemDate = new Date(item.date);
                                                const dayDate = new Date(day.date);

                                                // Compare dates directly instead of using day of week
                                                return itemDate.toDateString() === dayDate.toDateString();
                                            });
                                            return (
                                                <td
                                                    key={day.label}
                                                    className="py-2 px-2 border border-gray-200 w-[250px]"
                                                >
                                                    {scheduleForDay ? (
                                                        <>
                                                            <div>
                                                                <span className="pr-2 font-semibold text-green-500">Class:</span>
                                                                <span className="text-blue-800 cursor-pointer">
                                                                    {scheduleForDay.class.name}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="pr-2 font-semibold text-orange-500">Course:</span>
                                                                <span className="text-blue-800 cursor-pointer">
                                                                    {scheduleForDay.class.course}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="pr-2 font-semibold text-blue-500">Room:</span>
                                                                <span className="text-blue-800 cursor-pointer">
                                                                    {scheduleForDay.room.name}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-md text-gray-500 font-semibold">
                                                                    {scheduleForDay.room.location}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : null}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}