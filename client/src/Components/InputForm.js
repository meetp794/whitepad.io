import React from 'react'
import {Container, FormControl, FormLabel, FormErrorMessage, FormHelperText, Input, Button} from '@chakra-ui/react'
import './styles.css'

function InputForm({stepBack, onSubmit, nameTyping, roomTyping, newGame, room}) {
    if (newGame) {
        return (
            <Container className="mainContainer">
                <FormLabel>Name</FormLabel>
                <Input type="text" onChange={(e) => nameTyping(e.target.value)}/>
                <Container className="buttons" marginTop={6} marginLeft={0}>
                    <Button className="newgameButton" onClick={() => stepBack()}>Back</Button>
                    <Button className="newgameButton" onClick={() => onSubmit()} marginLeft={10}>Create Room</Button>
                </Container>
            </Container>
        )
    } else  {
        return (
            <Container className="mainContainer">
                <Container className="nameContainer">
                    <FormLabel>Name</FormLabel>
                    <Input type="text" onChange={(e) => nameTyping(e.target.value)}/>
                </Container>
                <Container className="roomContainer">
                    <FormLabel>Room ID</FormLabel>
                    <Input type="text" onChange={(e) => roomTyping(e.target.value)}/>
                </Container>
                <Container className="buttons" marginTop={6}>
                    <Button className="newgameButton" onClick={() => stepBack()}>Back</Button>
                    <Button className="newgameButton" onClick={() => onSubmit()} marginLeft={10}>Join</Button>
                </Container>
                
            </Container>
        )
    }
}

export default InputForm