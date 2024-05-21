import React, {useState, useEffect, useContext} from 'react'
import Choice from '../Components/Choice'
import InputForm from '../Components/InputForm'
import { socketContext } from '../Context/socket'

import { Redirect } from 'react-router'
import socketIOClient from 'socket.io-client'
const ENDPOINT = 'http://localhost:4000'

function IndexPage() {
    const socket = useContext(socketContext)
    const [step, setStep] = useState(1)
    const [name, setName] = useState('')
    const [newGame, setNewGame] = useState(null)
    const [room, setRoom] = useState('')
    const [loading, setLoading] = useState(false)
    const [serverConfirmed, setServerConfirmed] = useState(false)
    const [error, setError] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {

        socket.on('newGameCreated', (room) => {
            console.log(room)
            setRoom(room)
            setServerConfirmed(true)
        })

        socket.on('joinConfirmed', () => {
            setServerConfirmed(true)
        })

        socket.on('errorMessage', (message) => {
            displayError(message)
        })

    }, [])

    const onChoice = (choice) => {
        const c = choice === 'new' ? true : false
        setNewGame(c)
        stepForward()
    }

    const nameTyping = (s) => {
        setName(s)
    }

    const roomTyping = (s) => {
        setRoom(s)
    }

    const validate = () => {
        if (newGame) {
            return !(name === '')
        } else {
            return !(name === '') && !(room === '')
        }
    }

    const onSubmit = () => {
        setLoading(true)
        if (validate()) {
            if (newGame) {
                console.log(socket)
                socket.emit('newGame')
            } else {
                socket.emit('joining', {room: room})
            }
        } else {
            setTimeout(() => setLoading(false), 500)
            displayError(newGame ? 'Please fill out your name' : 'Please fill out your name and room id')
        }
    }

    const stepBack = () => {
        setStep(step - 1)
    }

    const stepForward = () => {
        setStep(step + 1)
    }

    const displayError = (message) => {
        setError(true)
        setErrorMsg(message)
        setLoading(false)
        setTimeout(() => {
            setError(false)
            setErrorMsg('')
        }, 3000)
    }

    if (serverConfirmed) {
        return (
            <Redirect to={ `/whitepad?room=${room}&name=${name}`} />
        )
    } else {
        switch(step) {
            case(1):
                return (
                    <Choice onChoice={onChoice} />
                )
            case(2):
                return (
                    <InputForm stepBack={stepBack} onSubmit={onSubmit} newGame={newGame} name={name} room={room} nameTyping={nameTyping} roomTyping={roomTyping}/>
                )
        }
    }
}

export default IndexPage