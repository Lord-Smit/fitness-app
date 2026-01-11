
import React, { createContext, useState, useEffect, useContext } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processQueue } from '../services/OfflineQueue';

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(true);
    const [isInternetReachable, setIsInternetReachable] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
            setIsInternetReachable(state.isInternetReachable);

            console.log('Network state changed:', state.isConnected ? 'Online' : 'Offline');

            if (state.isConnected && state.isInternetReachable) {
                processQueue();
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <NetworkContext.Provider value={{ isConnected, isInternetReachable }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => useContext(NetworkContext);
