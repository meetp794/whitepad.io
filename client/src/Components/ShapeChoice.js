import React, {useRef} from 'react'
import {VStack, Text, Popover, PopoverTrigger, useDisclosure, PopoverContent, PopoverBody, Select} from '@chakra-ui/react'


export default function ShapeChoice ({addRect, addTri, addEllispe, addRoundedRectangle, addDiamond, addParellogram}) {
    const {isOpen, onOpen, onClose} = useDisclosure()
    const inputRef = useRef(null)

    // <Text _hover={{cursor: "pointer"}} onClick={() => addRect(canvas)}>Rectangle</Text>

    return (
        <Popover placement="bottom" isOpen={isOpen} onClose={onClose} initialFocusRef={inputRef}>
            <PopoverTrigger>
                <Text _hover={{cursor: "pointer"}} onClick={() => onOpen()}>Shapes</Text>
            </PopoverTrigger>
            <PopoverContent width={200}>
                {/* <PopoverBody>
                    <Select color="black" bg="white" placeholder="Select Colour" onChange={(e) => changeColour(e.target.value)}>
                        <option value="#F24E1E" bgColor="#F24E1E">Red</option>
                        <option value="#FFC700" bgColor="#FFC700">Yellow</option>
                        <option value="#0FA958" bgColor="#0FA958">Green</option>
                        <option value="#699BF7" bgColor="#699BF7">Blue</option>
                        <option value="#9747FF" bgColor="#9747FF">Violet</option>
                        <option value="#D27C2C" bgColor="#D27C2C">Brown</option>
                        <option value="#545454" bgColor="#545454">Charcoal</option>
                        <option value="#F8F8F8" bgColor="#F8F8F8">White</option>
                    </Select>
                </PopoverBody> */}
                <VStack spacing={2} color="white" fontWeight="medium" fontSize="16px" px={3.5} bgColor="black" alignContent="center">
                    <Text _hover={{cursor: "pointer"}} onClick={() => addRect()} marginTop={1} >Rectangle</Text>
                    <Text _hover={{cursor: "pointer"}} onClick={() => addTri()}>Triangle</Text>
                    <Text _hover={{cursor: "pointer"}} onClick={() => addEllispe()}>Ellispe</Text>
                    <Text _hover={{cursor: "pointer"}} onClick={() => addRoundedRectangle()}>Rounded Rectangle</Text>
                    <Text _hover={{cursor: "pointer"}} onClick={() => addDiamond()}>Diamond</Text>
                    <Text _hover={{cursor: "pointer"}} onClick={() => addParellogram()} marginBottom={5}>Parellogram</Text>
                </VStack>
            </PopoverContent>
        </Popover>
    )

}