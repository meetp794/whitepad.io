import socketIOClient from 'socket.io-client'
import React from 'react'
const ENDPOINT = 'http://localhost:4000'

export const socket = socketIOClient(ENDPOINT, {transports: ["websocket"]})
socket.on('connect_error', (err) => {
    console.log(err)
})
console.log(socket)
export const socketContext = React.createContext()