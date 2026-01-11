
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../config/api';

const QUEUE_KEY = 'offline_queue';

export const addToQueue = async (requestData) => {
    try {
        const queue = await getQueue();
        queue.push({
            ...requestData,
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        });
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        console.log('Added to offline queue:', requestData.url);
    } catch (error) {
        console.error('Error adding to offline queue:', error);
    }
};

export const getQueue = async () => {
    try {
        const queue = await AsyncStorage.getItem(QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch (error) {
        console.error('Error getting offline queue:', error);
        return [];
    }
};

export const processQueue = async () => {
    const queue = await getQueue();
    if (queue.length === 0) return;

    console.log('Processing offline queue...', queue.length, 'items');

    const remainingQueue = [];
    const token = await AsyncStorage.getItem('token');

    if (!token) {
        console.log('No token found, cannot process queue');
        return;
    }

    for (const item of queue) {
        try {
            console.log('Processing item:', item.url);

            await apiClient({
                method: item.method,
                url: item.url,
                data: item.data,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Successfully processed offline item:', item.url);
        } catch (error) {
            console.error('Error processing offline item:', error.message);

            // If 4xx error (client error like validation), we should probably discard it or notify user
            // If 5xx or network error, keep in queue
            if (!error.response || error.response.status >= 500) {
                remainingQueue.push(item);
            } else {
                console.log('Discarding item due to client error:', error.response.status);
            }
        }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));

    if (remainingQueue.length < queue.length) {
        // Logic to trigger a refresh if possible, but context is separate.
        // We can rely on SWR (Stale While Revalidate) logic in screens to pick up new data eventually.
    }
};
