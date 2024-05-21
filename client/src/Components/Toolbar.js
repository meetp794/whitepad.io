import React, {useRef} from 'react'
import {HStack, Text, Popover, PopoverTrigger, useDisclosure, PopoverContent, PopoverBody, Select} from '@chakra-ui/react'
import ShapeChoice from './ShapeChoice'

function Toolbar({addRect, canvas, addText, draw, select, active, emitModify, emitPositionChange, emitDelete, addSticky, undo, toggleConnectorMode, redo, removeInState, createGroup, unGroup, addImage, panningMode, removeConnector, addTri, addEllispe, addRoundedRect, addDiamond, addParellogram, duplicate}) {

    const {isOpen, onOpen, onClose} = useDisclosure()
    const inputRef = useRef(null)
    let hiddenInput = false

    const changeColour = (colour) => {
        const activeobj = canvas.getActiveObject().set("fill", colour)
        canvas.renderAll()

        const modifiedObj = {
            obj: activeobj,
            id: activeobj.id,
          }
          emitModify(modifiedObj)
    }
    

    const changeFont = (font) => {
        const activeobj = canvas.getActiveObject().set("fontFamily", font)
        canvas.renderAll()

        const modifiedObj = {
            obj: activeobj,
            id: activeobj.id,
          }
          emitModify(modifiedObj)
    }

    const sendBack = () => {
        const activeobj = canvas.getActiveObject()
        canvas.sendToBack(activeobj)
        canvas.renderAll()
        const modifiedObj = {
            obj: activeobj,
            id: activeobj.id,
          }
        emitPositionChange('back', modifiedObj)
        
    }

    const sendFront = () => {
        const activeobj = canvas.getActiveObject()
        canvas.bringToFront(activeobj)
        canvas.renderAll()
        const modifiedObj = {
            obj: activeobj,
            id: activeobj.id,
          }
        emitPositionChange('front', modifiedObj)
    }

    const deleteObj = () => {
        const activeobj = canvas.getActiveObject()
        canvas.remove(activeobj)
        const modifiedObj = {
            obj: activeobj,
            id: activeobj.id
        }
        removeInState(activeobj)
        emitDelete(modifiedObj)
    }

    const removeGroup = () => {
        const activeObj = canvas.getActiveObject()
        unGroup()
        removeInState(activeObj)
    }

    if (!active) {

        return (
            <HStack h={35} spacing={5} color="white" fontWeight="medium" fontSize="16px" px={3.5} bgColor="black" alignContent="center">
                <Text _hover={{cursor: "pointer"}} style={{marginLeft: "10px"}} onClick={() => select()}>Select</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => panningMode()}>Pan</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => draw()}>Draw</Text>
                <ShapeChoice addRect={addRect} addTri={addTri} addEllispe={addEllispe} addRoundedRectangle={addRoundedRect} addDiamond={addDiamond} addParellogram={addParellogram} />
                <Text _hover={{cursor: "pointer"}} onClick={() => addText(canvas)}>Text</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => hiddenInput.click()}>Image</Text>
                <input hidden type="file" ref={el => hiddenInput = el} onChange={(e) => addImage(e)} />
                <Text _hover={{cursor: "pointer"}} onClick={() => toggleConnectorMode()}>Connector</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => undo()}>Undo</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => redo()}>Redo</Text>
            </HStack>
        )
    } else if (active.type === 'rect') {
        return (
            <HStack h={35} spacing={5} color="white" fontWeight="medium" fontSize="16px" px={3.5} bgColor="black" alignContent="center">
                <Text _hover={{cursor: "pointer"}} style={{marginLeft: "10px"}} onClick={() => select()}>Select</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => panningMode()}>Pan</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => draw()}>Draw</Text>
                <ShapeChoice addRect={addRect} addTri={addTri} addEllispe={addEllispe} addRoundedRectangle={addRoundedRect} addDiamond={addDiamond} addParellogram={addParellogram} />
                <Text _hover={{cursor: "pointer"}} onClick={() => addText(canvas)}>Text</Text>
                <Text _hover={{cursor: "pointer"}}>Image</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => toggleConnectorMode()}>Connector</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => undo()}>Undo</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => redo()}>Redo</Text>
                <Text _hover={{cursor: "pointer"}}>|</Text>
                <Popover placement="bottom" isOpen={isOpen} onClose={onClose} initialFocusRef={inputRef}>
                    <PopoverTrigger>
                        <Text _hover={{cursor: "pointer"}} onClick={() => onOpen()}>Colour</Text>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverBody>
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
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
                <Text _hover={{cursor: "pointer"}} onClick={() => sendBack()}>Back</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => sendFront()}>Front</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => deleteObj()}>Delete</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => duplicate()}>Duplicate</Text>

                
            </HStack>
        )
    } else if (active.type === 'textbox') {
        return (
            <HStack h={35} spacing={5} color="white" fontWeight="medium" fontSize="16px" px={3.5} bgColor="black" alignContent="center">
                <Text _hover={{cursor: "pointer"}} style={{marginLeft: "10px"}} onClick={() => select()}>Select</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => panningMode()}>Pan</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => draw()}>Draw</Text>
                <ShapeChoice addRect={addRect} addTri={addTri} addEllispe={addEllispe} addRoundedRectangle={addRoundedRect} addDiamond={addDiamond} addParellogram={addParellogram} />
                <Text _hover={{cursor: "pointer"}} onClick={() => addText(canvas)}>Text</Text>
                <Text _hover={{cursor: "pointer"}}>Image</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => toggleConnectorMode()}>Connector</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => undo()}>Undo</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => redo()}>Redo</Text>
                <Text _hover={{cursor: "pointer"}}>|</Text>
                <Popover placement="bottom" isOpen={isOpen} onClose={onClose} initialFocusRef={inputRef}>
                    <PopoverTrigger>
                        <Text _hover={{cursor: "pointer"}} onClick={() => onOpen()}>Colour</Text>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverBody>
                            <Select color="black" bg="white" placeholder="Select Text Colour" onChange={(e) => changeColour(e.target.value)}>
                                <option value="#F24E1E" bgColor="#F24E1E">Red</option>
                                <option value="#FFC700" bgColor="#FFC700">Yellow</option>
                                <option value="#0FA958" bgColor="#0FA958">Green</option>
                                <option value="#699BF7" bgColor="#699BF7">Blue</option>
                                <option value="#9747FF" bgColor="#9747FF">Violet</option>
                                <option value="#D27C2C" bgColor="#D27C2C">Brown</option>
                                <option value="#545454" bgColor="#545454">Charcoal</option>
                                <option value="#F8F8F8" bgColor="#F8F8F8">White</option>
                            </Select>
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
                <Select placeholder={active.fontFamily} w={60} color="white" bg="black" onChange={(e) => changeFont(e.target.value)}>
                    <option value="sans-serif" style={{color: 'black'}}>Sans-Serif</option>
                    <option value="Inconsolata" bgColor="#FFC700" style={{color: 'black'}}>Inconsolata</option>
                    <option value="Times New Roman" bgColor="#0FA958" style={{color: 'black'}}>Times New Roman</option>
                    <option value="Quicksand" bgColor="#699BF7" style={{color: 'black'}}>Quicksand</option>
                    <option value="Pacifico" bgColor="#9747FF" style={{color: 'black'}}>Pacifico</option>
                </Select>
                <Text _hover={{cursor: "pointer"}} onClick={() => sendBack()}>Back</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => sendFront()}>Front</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => deleteObj()}>Delete</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => duplicate()}>Duplicate</Text>

                
            </HStack>
        )
    } else if (canvas.getActiveObjects().length > 1)  {
        return (
            <HStack h={35} spacing={5} color="white" fontWeight="medium" fontSize="16px" px={3.5} bgColor="black" alignContent="center">
                <Text _hover={{cursor: "pointer"}} style={{marginLeft: "10px"}} onClick={() => select()}>Select</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => panningMode()}>Pan</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => draw()}>Draw</Text>
                <ShapeChoice addRect={addRect} addTri={addTri} addEllispe={addEllispe} addRoundedRectangle={addRoundedRect} addDiamond={addDiamond} addParellogram={addParellogram} />
                <Text _hover={{cursor: "pointer"}} onClick={() => addText(canvas)}>Text</Text>
                <Text _hover={{cursor: "pointer"}}>Image</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => toggleConnectorMode()}>Connector</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => undo()}>Undo</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => redo()}>Redo</Text>
                <Text _hover={{cursor: "pointer"}}>|</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => createGroup(canvas, canvas.getActiveObjects())}>Group</Text>
            </HStack>
        )

    } else if (active.type === 'group') {
        return (
            <HStack h={35} spacing={5} color="white" fontWeight="medium" fontSize="16px" px={3.5} bgColor="black" alignContent="center">
                <Text _hover={{cursor: "pointer"}} style={{marginLeft: "10px"}} onClick={() => select()}>Select</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => panningMode()}>Pan</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => draw()}>Draw</Text>
                <ShapeChoice addRect={addRect} addTri={addTri} addEllispe={addEllispe} addRoundedRectangle={addRoundedRect} addDiamond={addDiamond} addParellogram={addParellogram} />
                <Text _hover={{cursor: "pointer"}} onClick={() => addText(canvas)}>Text</Text>
                <Text _hover={{cursor: "pointer"}}>Image</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => toggleConnectorMode()}>Connector</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => undo()}>Undo</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => redo()}>Redo</Text>
                <Text _hover={{cursor: "pointer"}}>|</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => removeGroup()}>UnGroup</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => duplicate()}>Duplicate</Text>

            </HStack>
        )

    } else if (active.type === 'lineArrow') {
        return (
            <HStack h={35} h={35} spacing={5} color="white" fontWeight="medium" fontSize="16px" px={3.5} bgColor="black" alignContent="center">
                <Text _hover={{cursor: "pointer"}} style={{marginLeft: "10px"}} onClick={() => select()}>Select</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => panningMode()}>Pan</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => draw()}>Draw</Text>
                <ShapeChoice addRect={addRect} addTri={addTri} addEllispe={addEllispe} addRoundedRectangle={addRoundedRect} addDiamond={addDiamond} addParellogram={addParellogram} />
                <Text _hover={{cursor: "pointer"}} onClick={() => addText(canvas)}>Text</Text>
                <Text _hover={{cursor: "pointer"}}>Image</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => toggleConnectorMode()}>Connector</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => undo()}>Undo</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => redo()}>Redo</Text>
                <Text _hover={{cursor: "pointer"}}>|</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => removeConnector()}>Delete</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => duplicate()}>Duplicate</Text>

            </HStack>
        )
    } else {
        return (
            <HStack h={35} h={35} spacing={5} color="white" fontWeight="medium" fontSize="16px" px={3.5} bgColor="black" alignContent="center">
                <Text _hover={{cursor: "pointer"}} style={{marginLeft: "10px"}} onClick={() => select()}>Select</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => panningMode()}>Pan</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => draw()}>Draw</Text>
                <ShapeChoice addRect={addRect} addTri={addTri} addEllispe={addEllispe} addRoundedRectangle={addRoundedRect} addDiamond={addDiamond} addParellogram={addParellogram} />
                <Text _hover={{cursor: "pointer"}} onClick={() => addText(canvas)}>Text</Text>
                <Text _hover={{cursor: "pointer"}}>Image</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => toggleConnectorMode()}>Connector</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => undo()}>Undo</Text>
                <Text _hover={{cursor: "pointer"}} onClick={() => redo()}>Redo</Text>
            </HStack>
        )
    }

}

export default Toolbar