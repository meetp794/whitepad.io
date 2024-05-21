//utilities functions and classes
const {randRoom} = require('./Utilities/utilFunctions')

const cors = require('cors')
//set up express server
const express = require('express')
const http = require('http')
const socketio = require('socket.io')

const PORT = process.env.PORT || 4000

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(cors())

//Store the room ids mapping to the room property object 
//The room property object looks like this {roomid:str, players:Array(2)}
const rooms = new Map()
const socketRooms = new Map()

//Promise function to make sure room id is unique
const makeRoom = (resolve) =>{
    var newRoom = randRoom()
    console.log(newRoom)
    while (rooms.has(newRoom)){
        newRoom = randRoom()
    }
    rooms.set(newRoom, {roomId: newRoom, players:[], canvas: null})
    resolve(newRoom)
}

const getPlayers = (room) => {
    var players = []
    for (var i = 0; i < room.players.length; i++) {
        players.push(room.players[i][0])
    }
    return players
}

const setDic = (room, dic) => {
    currentRoom = rooms.get(room)
    currentRoom.canvas = dic
}

const getDic = (room) => {
    currentRoom = rooms.get(room)
    return currentRoom.canvas
}

//Put the newly joined player into a room's player list 
const joinRoom = (player, room, id) => {
    currentRoom = rooms.get(room)
    const players = getPlayers(currentRoom)
    if (!(players.includes(player))) {
        updatedPlayerList = currentRoom.players.push([player, id])
        updatedRoom = {...currentRoom, players:updatedPlayerList}
    }
}

const remove = (room, id) => {
    
    console.log(room)
    currentRoom = rooms.get(room)
    console.log(currentRoom)
    var active = []
    for (var i = 0; i < currentRoom.players.length; i++) {
        if (!currentRoom.players[i].includes(id)) {
            active.push(currentRoom.players[i])
        }
    }
    currentRoom.players = active
}

//Remove the latest player joined from a room's player list 
function kick(room){
    currentRoom = rooms.get(room)
    currentRoom.players.pop()
}

//Check how many player is currently in the room
function getRoomPlayersNum(room){
    return rooms.get(room).players.length 
}

//Assign x o values to each of the player class
function pieceAssignment(room){
    const firstPiece = randPiece()
    const lastPiece = firstPiece === 'X'? 'O':'X'

    currentRoom = rooms.get(room)
    currentRoom.players[0].piece = firstPiece
    currentRoom.players[1].piece = lastPiece
}

//Initialize a new board to a room
function newGame(room){
    currentRoom = rooms.get(room)
    const board = new Board
    currentRoom.board = board
}

io.on('connection', socket =>{
    //On the client submit event (on start page) to create a new room

    socket.on('newGame', () => {
        new Promise(makeRoom).then((room) => {
            socket.emit('newGameCreated', room)
        })
    })

    //On the client submit event (on start page) to join a room
    socket.on('joining', ({room}) => {
        if (rooms.has(room)){
            socket.emit('joinConfirmed')
        }else{
            socket.emit('errorMessage', 'No room with that id found')
        }
    })

    socket.on('object-added', ({data, room, name, objectDic}) => {
        console.log(data, room)
        setDic(room, objectDic)

        io.to(room).emit('new-add', {data, name})
    })

    socket.on('object-modified', ({data, room, name , objectDic}) => {
        console.log(data, room)
        setDic(room, objectDic)
        io.to(room).emit('new-modification', {data, name})
    })

    socket.on('object-pushBack', ({data, room , objectDic}) => {
        setDic(room, objectDic)
        io.to(room).emit('pushBack', {data})
    })

    socket.on('object-pushFront', ({data, room , objectDic}) => {
        setDic(room, objectDic)
        io.to(room).emit('pushFront', {data})
    })

    socket.on('object-delete', ({data, room , objectDic}) => {
        setDic(room, objectDic)
        io.to(room).emit('delete-object', {data})
    })

    socket.on('group-added', ({data, room , objectDic}) => {
        setDic(room, objectDic)
        io.to(room).emit('new-group', {data})
    })

    socket.on('ungroup', ({data, room, objectDic}) => {
        setDic(room, objectDic)
        io.to(room).emit('ungroup', {data})
    })

    socket.on('add-connector', ({data, room, objectDic}) => {
        setDic(room, objectDic)
        io.to(room).emit('new-connector', {data})
    })

    socket.on('remove-connector', ({data, room, objectDic}) => {
        setDic(room, objectDic)
        io.to(room).emit('remove-connector', {data})
    })

    socket.on('newRoomJoin', ({room,name})=>{
        //If someone tries to go to the game page without a room or name then
        //redirect them back to the start page
        if (room === '' || name ===''){
            io.to(socket.id).emit('joinError')
        }

        //Put the new player into the room
        socket.join(room)
        const id = socket.id
        joinRoom(name, room, id)
        const users = getPlayers(rooms.get(room))
        currentRoom = rooms.get(room)
        const initObjs = getDic(room)
        socketRooms[id] = room
        io.to(room).emit('usersUpdate', {users, initObjs, name})

        //Get the number of player in the room
        const peopleInRoom = getRoomPlayersNum(room)

    })

    //Listener event for each move and emit different events depending on the state of the game
    socket.on('move', ({room, piece, index}) => {
        currentBoard = rooms.get(room).board
        currentBoard.move(index, piece)

        if (currentBoard.checkWinner(piece)){
            io.to(room).emit('winner', {gameState:currentBoard.game, id:socket.id})
        }else if(currentBoard.checkDraw()){
            io.to(room).emit('draw', {gameState:currentBoard.game})
        }else{
            currentBoard.switchTurn()
            io.to(room).emit('update', {gameState:currentBoard.game, turn:currentBoard.turn})
        }
    })

    //Listener event for a new game
    socket.on('playAgainRequest', (room) => {
        currentRoom = rooms.get(room)
        currentRoom.board.reset()
        //Reassign new piece so a player can't always go first
        pieceAssignment(room)
        currentPlayers = currentRoom.players
        for (const player of currentPlayers){
            io.to(player.id).emit('pieceAssignment', {piece: player.piece, id: player.id})
        }

        io.to(room).emit('restart', {gameState:currentRoom.board.game, turn:currentRoom.board.turn})
    })

    //On disconnect event
    socket.on('disconnecting', ()=> {
        //Get all the rooms that the socket is currently subscribed to
        // const room = socketRooms.get(socket.id)
        // console.log(room)
        // players = rooms.get(room).players
        // for (var i = 0; i < players.length; i++) {
            // if (players[i].includes(socket.id)) {
            //     updatedPlayerList = currentRoom.players.slice(i, 1)
            //     updatedRoom = {...currentRoom, players:updatedPlayerList}
            //     break
            // }
        // }
        // const users = getPlayers(rooms.get(room))
        // delete socketRooms.socket.id
        // io.to(room).emit('usersUpdate', {users})
        // console.log(socket.rooms)
        const socRooms = socket.rooms
        console.log(socRooms)
        if (socRooms.size === 2) {
            remove(Array.from(socRooms)[1], Array.from(socRooms)[0])
            const users = getPlayers(rooms.get(Array.from(socRooms)[1]))
            if (users.length === 0) {
                delete rooms[Array.from(socRooms)[1]]
            } else {
                io.to(Array.from(socRooms)[1]).emit('usersUpdate', {users})
            }
        }
    })        
})


server.listen(PORT, ()=>console.log(`Listening on port ${PORT}`))