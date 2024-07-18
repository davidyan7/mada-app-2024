import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import citiesJsonData from '../assets/pakarRegions.json';
import { processCitiesData } from '../utils/processCitiesData';
import Select from 'react-select';
import alarmSound from '../assets/sound.mp4';

function TrainingPage() {
    const [alarms, setAlarms] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const audioRef = useRef(null);
    const previousAlarmsRef = useRef([]);

    useEffect(() => {
        const processedCities = processCitiesData(citiesJsonData);
        setCities(processedCities);

        const alarmsRef = ref(db, 'alarms');

        const unsubscribe = onValue(alarmsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const alarmList = Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...value,
                }));
                setAlarms(alarmList);

                // Check for new active alarms within the selected regions
                const newActiveAlarms = alarmList.filter(
                    alarm => {
                        const city = processedCities.find(city => city.HEB_NAME === alarm.city);
                        return alarm.isActive &&
                            !previousAlarmsRef.current.some(prevAlarm => prevAlarm.id === alarm.id) &&
                            (selectedRegions.length === 0 || (city && selectedRegions.includes(city.MadaRegions)));
                    }
                );

                if (newActiveAlarms.length > 0 && audioRef.current) {
                    audioRef.current.play();
                }

                previousAlarmsRef.current = alarmList;
            } else {
                setAlarms([]);
                previousAlarmsRef.current = [];
            }
        });

        return () => unsubscribe();
    }, [selectedRegions]);

    useEffect(() => {
        const interval = setInterval(() => {
            alarms.forEach((alarm) => {
                if (alarm.isActive) {
                    const elapsedTime = Date.now() - alarm.timestamp;
                    if (elapsedTime >= 20000) { // 20 seconds
                        update(ref(db, `alarms/${alarm.id}`), { isActive: false });
                    }
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [alarms]);

    const getAlarmClass = (countdown) => {
        if (countdown > 30) return 'alarm-yellow';
        if (countdown === 30) return 'alarm-red';
        return 'alarm-default';
    };

    const uniqueRegions = [...new Set(cities.map(city => city.MadaRegions))];
    const regionOptions = uniqueRegions.map(region => ({ value: region, label: region }));

    const handleRegionChange = (selectedOptions) => {
        setSelectedRegions(selectedOptions.map(option => option.value));
    };

    const filteredAlarms = alarms.filter((alarm) => {
        const city = cities.find(city => city.HEB_NAME === alarm.city);
        return selectedRegions.length === 0 || (city && selectedRegions.includes(city.MadaRegions));
    });

    const activeAlarms = filteredAlarms.filter(alarm => alarm.isActive);
    const archivedAlarms = filteredAlarms.filter(alarm => !alarm.isActive);

    return (
        <div className="training-page">
            <div className="filter-container">
                <Select
                    isMulti
                    name="regions"
                    options={regionOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={handleRegionChange}
                    placeholder="Filter by MadaRegions..."
                />
            </div>
            <div className="page-container">
                <div className="column">
                    <h2>ארכיון</h2>
                    <div className="scrollable-list">
                        {archivedAlarms.map((alarm) => (
                            <div key={alarm.id} className={`alarm-item ${getAlarmClass(alarm.countdown)}`}>
                                <strong>{new Date(alarm.timestamp).toLocaleTimeString()}      {alarm.city}</strong>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="column">
                    <h2>התרעות חדשות</h2>
                    <div className="scrollable-list">
                        {activeAlarms.map((alarm) => (
                            <div key={alarm.id} className={`alarm-item ${getAlarmClass(alarm.countdown)}`}>
                                <strong>{new Date(alarm.timestamp).toLocaleTimeString()} {alarm.city}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <audio ref={audioRef} src={alarmSound} />
        </div>
    );
}

export default TrainingPage;