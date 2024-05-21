import React from 'react'
import {HStack, Text} from '@chakra-ui/react'

function User({name}) {
    console.log(name)
    return (
        <HStack p={2} rounded="md" _hover={{bgColor: "gray.200"}}>
            <Text fontWeight="medium" color="black">{name}</Text>
        </HStack>
    )
}

export default User