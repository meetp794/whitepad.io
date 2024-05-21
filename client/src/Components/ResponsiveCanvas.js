import React, { useEffect, useRef, useContext } from 'react';
import {fabric} from 'fabric'
import { socketContext } from '../Context/socket';

import useWindowSize from '../Hooks/useWindowSize';
import './styles.css'


export default function ResponsiveCanvas({setCanvas, onResize, emitModify}) {
    const {width, height} = useWindowSize('canvasc');
    const canvasRef = useRef()
    const firstRender = useRef(true)
    const socket = useContext(socketContext)

    const initCanvas = () => {
        const c = new fabric.Canvas('canvas', {backgroundColor: 'white'})

        c.on('mouse:wheel', function(opt) {
            var delta = opt.e.deltaY
            var zoom = c.getZoom()
            zoom *= 0.999 ** delta
            if (zoom > 20) {
                zoom = 20
            } else if (zoom < 0.01) {
                zoom = 0.01
            }

            c.zoomToPoint({x: opt.e.offsetX, y: opt.e.offsetY}, zoom)
            opt.e.preventDefault()
            opt.e.stopPropagation()
        })

        var x0
        var y0
        let state = 'idle'

        // c.on('mouse:down', (e) => {
        //     if (c.getActiveObject() === null && c.isDrawingMode === false) {
        //         console.log('y')
        //         state = 'panning'
        //         x0 = e.screenX
        //         y0 = e.screenY
        //     } else {
        //         return
        //     }
        // })

        // c.on('mouse:up', function(e) {
        //     state = 'idle'
        // })

        // c.on('mouse:move', (e) => {
        //     if (state === 'panning') {
        //         let x = e.screenX
        //         let y = e.screenY
        //         c.relativePan({x: x - x0, y: y - y0})
        //         x0 = x
        //         y0 = y
        //     }
        // })

        return c
    }

    useEffect(() => {
        setCanvas(initCanvas())
    }, [])

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false
            return
        }
        onResize(width, height)
    }, [width, height])

    return (
        <div id="canvasc" className="canvascontainer">
            <canvas
            id='canvas'
            ref={canvasRef}
            width={width}
            height={height}
            style={{display: "block"}}
            />
        </div>

    )
};