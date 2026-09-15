import { io, Socket } from 'socket.io-client';

// An empty/unset VITE_SOCKET_URL means "same origin" - passing undefined to io() connects
// to the page's own host, which the dev server proxy (vite.config.ts) then forwards to the
// backend. This is what makes it work both from localhost and from a phone on the LAN.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  if (!socket) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, cannot create socket connection');
      return null;
    }

    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinClassRoom = (classId: string) => {
  const socketInstance = getSocket();
  if (socketInstance) {
    // Check if socket is connected, if not wait for connection
    if (socketInstance.connected) {
      socketInstance.emit('join-attendance-room', classId);
      console.log(`Joined attendance room for class: ${classId}`);
    } else {
      // Wait for connection then join
      socketInstance.once('connect', () => {
        socketInstance?.emit('join-attendance-room', classId);
        console.log(`Joined attendance room for class: ${classId}`);
      });
    }
  }
};

export const joinTeacherClassRoom = (classId: string) => {
  const socketInstance = getSocket();
  if (socketInstance) {
    // Check if socket is connected, if not wait for connection
    if (socketInstance.connected) {
      socketInstance.emit('join-class-room', classId);
      console.log(`Teacher joined class room: ${classId}`);
    } else {
      // Wait for connection then join
      socketInstance.once('connect', () => {
        socketInstance?.emit('join-class-room', classId);
        console.log(`Teacher joined class room: ${classId}`);
      });
    }
  }
};

export const leaveClassRoom = (classId: string) => {
  const socketInstance = getSocket();
  if (socketInstance && socketInstance.connected) {
    socketInstance.emit('leave-attendance-room', classId);
    console.log(`Left attendance room for class: ${classId}`);
  }
};

