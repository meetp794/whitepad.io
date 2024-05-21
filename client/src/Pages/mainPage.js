import React, {useState, useEffect} from 'react'

import { Redirect } from 'react-router-dom'
import socketIOClient from 'socket.io-client'
import {Heading, Button, Grid, GridItem, Center} from '@chakra-ui/react'
import './styles.css'

function mainPage() {
    return (
        <div className="mainContainer">
            <Grid templateRows="repeat(3, 1fr)" templateColumns="repeat(5, 1fr)">
                <GridItem colSpan={5} rowSpan={2} >
                    <Center h="100%" color="black">
                        <Heading as="h1" size="2xl">
                            WhitePad.io
                        </Heading>
                    </Center>
                </GridItem>
                <GridItem colStart={2} colEnd={3}>
                    <Button>
                        Start New
                    </Button>
                </GridItem>
                <GridItem colStart={4} colEnd={5}>
                    <Button>
                        Join Session
                    </Button>
                </GridItem>
            </Grid>
        </div>
    )
}

export default mainPage
