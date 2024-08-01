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
    const [isAudioInitialized, setIsAudioInitialized] = useState(false);
    const audioContextRef = useRef(null);
    const audioBufferRef = useRef(null);
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

                if (newActiveAlarms.length > 0 && isAudioInitialized) {
                    playAlarmSound();
                }

                previousAlarmsRef.current = alarmList;
            } else {
                setAlarms([]);
                previousAlarmsRef.current = [];
            }
        });

        return () => unsubscribe();
    }, [selectedRegions, isAudioInitialized]);

    useEffect(() => {
        const interval = setInterval(() => {
            setAlarms(prevAlarms =>
                prevAlarms.map(alarm => {
                    if (alarm.isActive) {
                        const elapsedTime = Date.now() - alarm.timestamp;
                        if (elapsedTime >= 22000) { // 22 seconds
                            update(ref(db, `alarms/${alarm.id}`), { isActive: false });
                            return { ...alarm, isActive: false };
                        }
                    }
                    return alarm;
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const initializeAudio = () => {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        fetch(alarmSound)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContextRef.current.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                audioBufferRef.current = audioBuffer;
                setIsAudioInitialized(true);
            })
            .catch(error => console.error("Error loading audio:", error));
    };

    const playAlarmSound = () => {
        if (audioContextRef.current && audioBufferRef.current) {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBufferRef.current;
            source.connect(audioContextRef.current.destination);
            source.start();
        }
    };

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

    // Sort alarms by timestamp in descending order (newest first)
    const sortedAlarms = filteredAlarms.sort((a, b) => b.timestamp - a.timestamp);

    const activeAlarms = sortedAlarms.filter(alarm => alarm.isActive);
    const archivedAlarms = sortedAlarms.filter(alarm => !alarm.isActive);

    const getCityMadaRegion = (cityName) => {
        const city = cities.find(city => city.HEB_NAME === cityName);
        return city ? city.MadaRegions : 'Unknown';
    };

    return (
        <div className="training-page">
            {!isAudioInitialized && (
                <button onClick={initializeAudio} className="init-audio-button">
                    Initialize Audio
                </button>
            )}
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
                                <strong>
                                    {new Date(alarm.timestamp).toLocaleTimeString()} {alarm.city} ({getCityMadaRegion(alarm.city)})
                                </strong>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="column">
                    <h2>התרעות חדשות</h2>
                    <div className="scrollable-list">
                        {activeAlarms.map((alarm) => (
                            <div key={alarm.id} className={`alarm-item ${getAlarmClass(alarm.countdown)}`}>
                                <strong>
                                    {new Date(alarm.timestamp).toLocaleTimeString()} {alarm.city} ({getCityMadaRegion(alarm.city)})
                                </strong>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TrainingPage;