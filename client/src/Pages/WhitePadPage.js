import React, {useState, useEffect, useRef, useContext} from 'react'
import { socketContext } from '../Context/socket'
import qs from 'qs'
import {Box, Button, Container, cookieStorageManager, Flex, Heading, HStack, Icon, Input, InputGroup, InputRightElement, Link, Select, Stack, Switch, Text, useToast} from '@chakra-ui/react'
import User from '../Components/User'
import Toolbar from '../Components/Toolbar'
import ResponsiveCanvas from '../Components/ResponsiveCanvas'
import {fabric} from 'fabric'
import {v1 as uuid} from 'uuid'
import { objStack } from '../Utils/objStack'
import { Redirect, useHistory } from 'react-router'

var wpState, wpFuture
var objectDic = {}
var x0, y0

const findTargetPort = (object) => {
    var points = new Array(4)
    var port = object.__corner

    switch(port) {
        case 'mt':
          points = [
            object.left + (object.width / 2), object.top,
            object.left + (object.width / 2), object.top
          ];
          break;
        case 'mr':
          points = [
            object.left + object.width, object.top + (object.height / 2),
            object.left + object.width, object.top + (object.height / 2)
          ];
          break;
        case 'mb':
          points = [
            object.left + (object.width / 2), object.top + object.height,
            object.left + (object.width / 2), object.top + object.height
          ];
          break;
        case 'ml':
          points = [
            object.left, object.top + (object.height / 2),
            object.left, object.top + (object.height / 2)
          ];
          break;

        default:
            break
    }

    return points
}

const getPortCenter = (object, port) => {
    var x1 = 0;
      var y1 = 0;

      switch (port) {

        case 'mt':
          x1 = object.left + (object.width / 2);
          y1 = object.top;
          break;

        case 'mr':
          x1 = object.left + object.width;
          y1 = object.top + (object.height / 2);
          break;

        case 'mb':
          x1 = object.left + (object.width / 2);
          y1 = object.top + object.height;
          break;
        case 'ml':
          x1 = object.left;
          y1 = object.top + (object.height / 2);
          break;

        default:
          break;
      }

      return {
        'x1': x1, 'y1': y1,
        'x2': x1, 'y2': y1
      }
}


fabric.StickyNote = fabric.util.createClass(fabric.Rect, {
    type: 'StickyNote',
    initialize: function (options) {
        options || (options = {});
        this.callSuper('initialize', options);
        this.set('label', options.label || '');
    },
    toObject: function () {
        return fabric.util.object.extend(this.callSuper('toObject'), {
            label: this.get('label')
        });
    },
    _render: function (ctx) {
        console.log('renderedlalala');
        this.callSuper('_render', ctx);
        ctx.font = '20px Helvetica';
        ctx.fillStyle = '#333';
        ctx.fillText(this.label, -this.width / 2+10, -this.height / 2 + 20);
        // var notediv = '<div class="canvas-notes" id="'+this._id+'" style="top: '+(this.top+70)+'px; left: '+this.left+'px;width: '+this.width+'px;height: '+this.height+'px;"></div>';
        // $('body').append(notediv);
    }
});

var Connector = fabric.util.createClass(fabric.Line, {

    type: 'connector',

      initialize: function(points, options) {
        this.callSuper('initialize', points, options);

      },

      fromObject: function(object) {
        return new Connector(object);

      },

      toObject: function() {
        return fabric.util.object.extend(this.callSuper('toObject'), {

        });
      },

      _render: function(ctx) {
        this.callSuper('_render', ctx);

      },

      toString: function() {
        return '#<ui-fabric.connector (' + this.complexity() + '" }>';

      }
})

fabric.LineArrow = fabric.util.createClass(fabric.Line, {

    type: 'lineArrow',
  
    initialize: function(element, options) {
      options || (options = {});
      this.callSuper('initialize', element, options);
    },
  
    toObject: function() {
      return fabric.util.object.extend(this.callSuper('toObject'));
    },
  
    _render: function(ctx) {
      this.callSuper('_render', ctx);
  
      // do not render if width/height are zeros or object is not visible
      if (this.width === 0 || this.height === 0 || !this.visible) return;
  
      ctx.save();
  
      var xDiff = this.x2 - this.x1;
      var yDiff = this.y2 - this.y1;
      var angle = Math.atan2(yDiff, xDiff);
      ctx.translate((this.x2 - this.x1) / 2, (this.y2 - this.y1) / 2);
      ctx.rotate(angle);
      ctx.beginPath();
      //move 10px in front of line to start the arrow so it does not have the square line end showing in front (0,0)
      ctx.moveTo(10, 0);
      ctx.lineTo(-20, 15);
      ctx.lineTo(-20, -15);
      ctx.closePath();
      ctx.fillStyle = this.stroke;
      ctx.fill();
  
      ctx.restore();
  
    }
  });
  
  fabric.LineArrow.fromObject = function(object, callback) {
    callback && callback(new fabric.LineArrow([object.x1, object.y1, object.x2, object.y2], object));
  };
  
  fabric.LineArrow.async = true;


const STATE_IDLE = 'idle';
const STATE_PANNING = 'panning';
fabric.Canvas.prototype.toggleDragMode = function(dragMode) {
// Remember the previous X and Y coordinates for delta calculations
let lastClientX;
let lastClientY;
// Keep track of the state
let state = STATE_IDLE;
// We're entering dragmode
if (dragMode) {
    // Discard any active object
    this.discardActiveObject();
    // Set the cursor to 'move'
    this.defaultCursor = 'move';
    // Loop over all objects and disable events / selectable. We remember its value in a temp variable stored on each object
    this.forEachObject(function(object) {
    object.prevEvented = object.evented;
    object.prevSelectable = object.selectable;
    object.evented = false;
    object.selectable = false;
    });
    // Remove selection ability on the canvas
    this.selection = false;
    // When MouseUp fires, we set the state to idle
    this.on('mouse:up', function(e) {
    state = STATE_IDLE;
    });
    // When MouseDown fires, we set the state to panning
    this.on('mouse:down', (e) => {
    state = STATE_PANNING;
    lastClientX = e.e.clientX;
    lastClientY = e.e.clientY;
    });
    // When the mouse moves, and we're panning (mouse down), we continue
    this.on('mouse:move', (e) => {
    if (state === STATE_PANNING && e && e.e) {
        // let delta = new fabric.Point(e.e.movementX, e.e.movementY); // No Safari support for movementX and movementY
        // For cross-browser compatibility, I had to manually keep track of the delta

        // Calculate deltas
        let deltaX = 0;
        let deltaY = 0;
        if (lastClientX) {
        deltaX = e.e.clientX - lastClientX;
        }
        if (lastClientY) {
        deltaY = e.e.clientY - lastClientY;
        }
        // Update the last X and Y values
        lastClientX = e.e.clientX;
        lastClientY = e.e.clientY;

        let delta = new fabric.Point(deltaX, deltaY);
        this.relativePan(delta);
        this.trigger('moved');
    }
    });
} else {
    // When we exit dragmode, we restore the previous values on all objects
    this.forEachObject(function(object) {
    object.evented = (object.prevEvented !== undefined) ? object.prevEvented : object.evented;
    object.selectable = (object.prevSelectable !== undefined) ? object.prevSelectable : object.selectable;
    });
    // Reset the cursor
    this.defaultCursor = 'default';
    // Remove the event listeners
    this.off('mouse:up');
    this.off('mouse:down');
    this.off('mouse:move');
    // Restore selection ability on the canvas
    this.selection = true;
}
};



function WhitePadPage() {

    const [thisname, setName] = useState('')
    const [users, setUsers] = useState([])
    const [room, setRoom] = useState('')
    const [canvas, setCanvas] = useState(null)
    const [active, setActive] = useState(null)
    const [initCanvas, setInitCanvas] = useState(false)
    const [initObjects, setInitObjects] = useState(null)
    const history = useHistory()
    const types = ['rect', 'triangle', 'textbox', 'ellispe', 'polygon', 'path']
    var selected
    var isMouseDown = false
    var connectorLine = null
    var arrowHead = null
    var connectorLineFromPort = null
    var connectorLineFromArrow = null
    var fromObject = null
    const socket = useContext(socketContext)
    var connectorMode = useRef(false)
    var panMode = useRef(false)
    console.log(connectorLine)

    async function handleCopy() {
        await navigator.clipboard.writeText(room)
    }

    // useEffect(() => {
    //     console.log('updated')
    // }, [canvas])

    if (active) {
        console.log(active.left)
    }

    // const save = () => {
    //     redo = []
    //     if (wpState) {
    //         undo.push(wpState)
    //     }
    //     wpState = JSON.stringify(canvas)
    // }

    useEffect(() => {

        const {room, name} = qs.parse(window.location.search, {
            ignoreQueryPrefix: true
        })

        setRoom(room)
        setName(name)
        socket.emit('newRoomJoin', {room, name})
        var currName = name

        // socket.on('usersUpdate', ({users}) => {
        //     console.log(users)
        //     setUsers(users)
        // })

        
        socket.on('usersUpdate', ({users, initObjs, name}) => {
            console.log(users)
            console.log(name)
            console.log(initObjs)
            console.log(thisname)
            if (currName === name && initObjs !== null) {
                setInitObjects(initObjs)
            }
            setUsers(users)
        })
        
    }, [])

    useEffect(() => {
        console.log(initCanvas)
        if (initCanvas && initObjects !== null) {
            console.log(initCanvas)
            canvas.selection = false
            var groupDic = {}
            for (var obj in initObjects) {
                console.log(obj)
                var info = initObjects[obj]
                var pastStack = info[0]
                var curr = pastStack.data.at(-1)
                console.log(curr)
                let object
                
                if (curr.type === 'rect') {
                    object = new fabric.Rect()
                } else if (curr.type === 'path') {
                    object = new fabric.Path(curr.path, {fill: curr.fill, stroke: curr.stroke, strokeWidth: curr.strokeWidth})
                    
                } else if (curr.type === 'textbox') {
                    object = new fabric.Textbox('')
                }  else if (curr.type === 'triangle') {
                    object = new fabric.Triangle()
                } else if (curr.type === 'ellipse') {
                    object = new fabric.Ellipse()
                } else if (curr.type === 'polygon') {
                    object = new fabric.Polygon()
                } else if (curr.type === 'group') {
                    groupDic[obj] = curr
                    continue
                } else if (curr.type === 'lineArrow') {
                    object = new fabric.LineArrow()
                }

                object.set({id: obj})
                object.set(curr)
                addToDic(object)
                canvas.add(object)
                console.log(object.id)
            }

            for (var obj in groupDic) {
                var g = groupDic[obj]
                if (!g.hidden) {
                    var left = g.left
                    var top = g.top
                    var objectsInGroup = g.objects
                    var objsInGroup = []
                    objectsInGroup.forEach((obj) => {
                        console.log(obj)
                        var curr = groupGet(obj.id)
                        objsInGroup.push(curr)
                        groupRemove(obj.id)
                    })

                    console.log(objsInGroup)
                    var group = new fabric.Group(objsInGroup, {left: left, top: top, id: obj})
                    addToDic(group)
                    canvas.add(group)
                }

                // var activeObj = canvas.getActiveObject();
                // var left = activeObj.left
                // var top = activeObj.top
                // var objIds = []
                // var objectsInGroup = activeObj._objects
                // objectsInGroup.forEach((obj) => {
                //     objIds.push(obj.id)
                //     canvas.remove(obj)
                // })

                // var group = new fabric.Group(objectsInGroup, {left: left, top: top, id: uuid()})
                // console.log(group.id)
                // canvas.add(group)
                // canvas.renderAll()
                // addToState(group)
                // emitGroup({objectsInGroup: objIds, left: left, top: top, id: group.id, oriName: thisname})
            }

            canvas.selection = true
            canvas.renderAll()
            setInitObjects(null)

        }
    }, [initCanvas, initObjects])

    const groupRemove = (id) => {
        canvas.forEachObject(function(obj) {
            if (obj.id === id) {
                canvas.remove(obj)
            }
        })
    }

    const groupGet = (id) => {
        var curr = null
        canvas.forEachObject(function(obj) {
            if (obj.id === id) {
                curr = obj
            }
        })

        return curr
    }

    useEffect(() => {
        if (canvas) {

            wpState = []
            wpFuture = []

            window.oncontextmenu = (e) => {
                e.preventDefault()
            }

            setInitCanvas(true)


            // if (initCanvas.current !== null) {
            //     if (initCanvas.current[0] && initCanvas.current[1] !== null) {
            //         setCanvas(canvas => canvas.loadFronJSON(initCanvas[1], canvas.renderAll()))
            //         initCanvas.current = [false]
            //     }
            // }

            canvas.on('mouse:over', function(e) {
                if (connectorMode.current === true) {
                    if (e.target !== null) {
                        if (active) {
                            active.set('active', false)
                        }
                        selected = e.target
                        canvas.setActiveObject(selected)
                        e.target.set({selectable: false})
                        e.target.set({hasRotatingPoint: false})
                        e.target.set({hasBorders: false})
                        e.target.set({transparentCorners: false})
                        // e.target.set({lockScalingX: true})
                        // e.target.set({lockScalingY: true})
                        e.target.setControlsVisibility({ 'tl': false, 'tr': false, 'br': false, 'bl': false });
                        canvas.renderAll()
                    }
                }
            })

            canvas.on('mouse:out', function(e) {
                if (connectorMode.current === true) {
                    if (selected) {
                        canvas.discardActiveObject()
                        selected.set({active: false})
                        selected.set({selectable: true})
                        selected.set({hasRotatingPoint: true})
                        selected.set({hasBorders: true})
                        selected.set({transparentCorners: true})
                        selected.setControlsVisibility({ 'tl': true, 'tr': true, 'br': true, 'bl': true });
                        selected = null
                        canvas.renderAll()
                    }
                }
            })

            canvas.on('mouse:down', function(e) {
                console.log(e.button)
                if (connectorMode.current === true) {
                    if (e.target !== null && fromObject === null) {
                        fromObject = selected
                        var points = null

                        if (fromObject.__corner === undefined){
                            return
                        }

                        isMouseDown = true
                        points = findTargetPort(fromObject)
                        connectorLineFromArrow = fromObject.__corner
                        connectorLineFromPort = fromObject.__corner
                        connectorLine = new fabric.LineArrow(points, {stroke: 'black', hasControls: true})
                        connectorLine.set({id: uuid()})
                        connectorLine.setCoords()
                        // arrowHead = new fabric.Polygon([{x: 0, y: 0}, {x: -20, y: -10}, {x: -20, y: 10}], {stroke: 'black', strokeWidth: '3'})
                        // arrowHead
                        canvas.add(connectorLine)
                        canvas.renderAll()
                    } else if (e.target !== null && fromObject !== null) {
                        if (fromObject.id !== selected.id) {
                            var points = null
                            var portCenter = null
                            if (selected.__corner !== undefined) {
                                points = findTargetPort(selected)
                                var toPort = selected.__corner
                                portCenter = getPortCenter(selected, toPort)
                                connectorLine.set({'x2': portCenter.x2, 'y2': portCenter.y2})
                                connectorLine.setCoords()
                                fromObject.set({connectors: {fromPort: [], fromLine: [], toPort: [], otherObject: []}})
                                fromObject.connectors.fromPort.push(connectorLineFromPort)
                                fromObject.connectors.fromLine.push(connectorLine)
                                fromObject.connectors.toPort.push(toPort)
                                fromObject.connectors.otherObject.push(selected)
                                selected.set({connectors: {fromPort: [], toLine: [], toPort: [], otherObject: []}})
                                selected.connectors.fromPort.push(connectorLineFromPort)
                                selected.connectors.toLine.push(connectorLine)
                                selected.connectors.toPort.push(toPort)
                                selected.connectors.otherObject.push(fromObject)
                                var connectPoints = [connectorLine.x1, connectorLine.y1, connectorLine.x2, connectorLine.y2]
                                connectorLine.set({locations: {fromObject: fromObject.id, toObject: selected.id}})
                                connectorLine.set({fromPort: connectorLineFromPort, toPort: toPort})
                                emitConnector({fromObject: fromObject.id, toObject: selected.id, connectorLine: connectorLine, fromPort: connectorLineFromPort, toPort: toPort, oriName: thisname, id: connectorLine.id, connectPoints: connectPoints})
                                addToState(connectorLine)
                                fromObject = null
                                connectorLine = null
                                connectorLineFromPort = null
                                canvas.renderAll()
                                
                            }
                        }
                    }
                } else if (panMode.current === true) {
                    isMouseDown = true
                    x0 = e.e.clientX
                    y0 = e.e.clientY
                }
            })

            canvas.on('mouse:move', function(e) {
                if (connectorMode.current === true) {
                    if (fromObject !== null) {
                        const pointer = canvas.getPointer(e.e)
                        connectorLine.set({'x2': pointer.x, 'y2': pointer.y})
                        connectorLine.setCoords()
                        canvas.renderAll()
                    }
                } else if (panMode.current === true && isMouseDown) {
                    console.log('rightmoving')
                    let deltaX = 0;
                    let deltaY = 0;
                    if (x0) {
                        deltaX = e.e.clientX - x0;
                    }
                    if (y0) {
                        deltaY = e.e.clientY - y0;
                    }
                    // Update the last X and Y values
                    x0 = e.e.clientX;
                    y0 = e.e.clientY;

                    let delta = new fabric.Point(deltaX, deltaY);
                    canvas.relativePan(delta);
                }
                // } else if (panMode.current === true) {
                //     var x = e.screenX
                //     var y = e.screenY
                //     canvas.relativePan({x: x - x0, y: y - y0})
                //     x0 = x
                //     y0 = y
                // }
            })

            canvas.on('mouse:up', function(e) {
                if (panMode.current === true) {
                    isMouseDown = false
                    x0 = null
                    y0 = null
                }
            })

            canvas.on('object:modified', function (options) {
                if (options.target) {
                  const modifiedObj = {
                    obj: options.target,
                    id: options.target.id,
                  }
                  modifyInState(options.target)
                  emitModify(modifiedObj)
                }
            })
    
            canvas.on('object:moving', function (options) {
                if (options.target) {
                  const modifiedObj = {
                    obj: options.target,
                    id: options.target.id,
                  }
                  console.log(options.target.left)
                  emitModify(modifiedObj)


                //   if (options.target.connectors) {
                //       var portCenter = null
                //       var i = null

                //       if (options.target.connectors.hasOwnProperty('fromLine')) {
                //           i = 0
                //           options.target.connectors.fromLine.forEach(function(line) {
                //               portCenter = getPortCenter(options.target, options.target.connectors.fromPort[i])
                //               line.set({'x1': portCenter.x1, 'y1': portCenter.y1})
                //               i++
                //           })
                //       }

                //       if (options.target.connectors.hasOwnProperty('toLine')) {
                //         i = 0
                //         options.target.connectors.toLine.forEach(function(line) {
                //             portCenter = getPortCenter(options.target, options.target.connectors.toPort[i])
                //             line.set({'x2': portCenter.x2, 'y2': portCenter.y2})
                //             i++
                //         })
                //       }

                //       canvas.renderAll()
                //   }
                }
            })

            canvas.on({'selection:created': function(options) {
                if (options.target) {
                    setActive(options.target)
                }
            }, 'selection:updated': function(options) {
                if (options.target) {
                    setActive(options.target)
                }
            }})

            canvas.on('selection:cleared', function() {
                setActive(null)
            })

            canvas.on('path:created', function(e) {
                const currpath = e.path
                currpath.set({id: uuid()})
                emitAdd({obj: currpath, id: currpath.id})
            })

            socket.on('new-add', ({data}) => {
                const {obj, id, oriName} = data

                if (oriName !== thisname) {
                    
                    let object
                
                    if (obj.type === 'rect') {
                        object = new fabric.Rect()
                    } else if (obj.type === 'path') {
                        object = new fabric.Path(obj.path, {fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth})
                        
                    } else if (obj.type === 'textbox') {
                        object = new fabric.Textbox('')
                    }  else if (obj.type === 'triangle') {
                        object = new fabric.Triangle()
                    } else if (obj.type === 'ellipse') {
                        object = new fabric.Ellipse()
                    } else if (obj.type === 'polygon') {
                        object = new fabric.Polygon()
                    }

                    object.set({id: id})
                    object.set(obj)
                    addToDic(object)
                    canvas.add(object)
                    canvas.renderAll()
                }
            })

            socket.on('new-group', ({data}) => {
                const {objectsInGroup, left, top, id, oriName} = data
                if (oriName !== thisname) {
                    var group = new fabric.Group()
                    canvas.forEachObject(function(obj) {
                        if (objectsInGroup.includes(obj.id)) {
                            group.addWithUpdate(obj)
                            canvas.remove(obj)
                        }
                    })

                    group.set({id: id})
                    group.set({left: left})
                    group.set({top: top})
                    group.set({hidden: false})
                    addToDic(group)
                    canvas.add(group)
                    canvas.renderAll()
                }
            })

            socket.on('ungroup', ({data}) => {
                const {id, oriName} = data
                if (oriName !== thisname) {
                    canvas.forEachObject(function(obj) {
                        if (obj.id === id) {
                            var objectsInGroup = obj._objects
                            obj._restoreObjectsState()
                            obj.set({hidden: true})
                            modifyInDic(obj)
                            canvas.remove(obj)
                            for (var i = 0; i < objectsInGroup.length; i++) {
                                canvas.add(objectsInGroup[i])
                                objectsInGroup[i].dirty = true
                                canvas.item(canvas.size()-1).hasControls = true;
                            }
                            canvas.renderAll()
                        }
                    })
                }
            })

            socket.on('new-connector', ({data}) => {
                const {fromObject, toObject, connectorLine, fromPort, toPort, oriName, id, connectPoints} = data
                if (oriName !== thisname) {
                    // connectorLine = new fabric.LineArrow(points, {stroke: 'black', hasControls: true})
                    // connectorLine.set({id: uuid()})
                    // connectorLine.setCoords()
                    // points = findTargetPort(selected)
                    // var toPort = selected.__corner
                    // portCenter = getPortCenter(selected, toPort)
                    // connectorLine.set({'x2': portCenter.x2, 'y2': portCenter.y2})
                    // connectorLine.setCoords()
                    // fromObject.set({connectors: {fromPort: [], fromLine: [], toPort: [], otherObject: []}})
                    // fromObject.connectors.fromPort.push(connectorLineFromPort)
                    // fromObject.connectors.fromLine.push(connectorLine)
                    // fromObject.connectors.toPort.push(toPort)
                    // fromObject.connectors.otherObject.push(selected)
                    // selected.set({connectors: {fromPort: [], toLine: [], toPort: [], otherObject: []}})
                    // selected.connectors.fromPort.push(connectorLineFromPort)
                    // selected.connectors.toLine.push(connectorLine)
                    // selected.connectors.toPort.push(toPort)
                    // selected.connectors.otherObject.push(fromObject)

                    var newConnector = new fabric.LineArrow(connectPoints, {stroke: 'black', hasControls: true})
                    newConnector.set({id: id})

                    canvas.forEachObject(function(obj) {
                        if (obj.id === fromObject) {
                            obj.set({connectors: {fromPort: [], fromLine: [], toPort: [], otherObject: []}})
                            obj.connectors.fromPort.push(fromPort)
                            obj.connectors.fromLine.push(newConnector)
                            obj.connectors.toPort.push(toPort)
                            obj.connectors.otherObject.push(toObject)
                        } else if (obj.id === toObject) {
                            obj.set({connectors: {fromPort: [], toLine: [], toPort: [], otherObject: []}})
                            obj.connectors.fromPort.push(fromPort)
                            obj.connectors.toLine.push(newConnector)
                            obj.connectors.toPort.push(toPort)
                            obj.connectors.otherObject.push(fromObject)
                        }
                    })

                    canvas.add(newConnector)
                    canvas.renderAll()

                }
            })

            socket.on('remove-connector', ({data}) => {
                const {obj, id} = data
                canvas.forEachObject(function(o) {
                    if (o.id === id) {
                        canvas.remove(o)
                    }

                    if (o.connectors) {

                        if (o.connectors.hasOwnProperty('fromLine')) {
                            if (o.connectors.fromLine.includes(obj)) {
                                var idx = o.connectors.fromLine.indexOf(obj)
                                o.connectors.fromLine.splice(idx, 1)
                            }
                        }
            
                        if (o.connectors.hasOwnProperty('toLine')) {
                            if (o.connectors.toLine.includes(obj)) {
                                var idx = o.connectors.toLine.indexOf(obj)
                                o.connectors.toLine.splice(idx, 1)
                            }
                        }
                    }
                })

                canvas.renderAll()


            })
      
            socket.on('new-modification', ({data, name}) => {
                // if (name != thisname) {
                const { obj, id } = data
                canvas.getObjects().forEach(object => {
                    if (object.id === id) {
                        object.set(obj)
                        object.setCoords()
                        updateConectors(object)
                        canvas.renderAll()
                    }
                })
                // }
            })

            socket.on('pushBack', ({data}) => {
                const {obj, id} = data
                canvas.getObjects().forEach(object => {
                    if (object.id === id) {
                        canvas.sendToBack(object)
                        canvas.renderAll()
                    }
                })
            })

            socket.on('pushFront', ({data}) => {
                const {obj, id} = data
                canvas.getObjects().forEach(object => {
                    if (object.id === id) {
                        canvas.bringToFront(object)
                        canvas.renderAll()
                    }
                })
            })

            socket.on('delete-object', ({data}) => {
                const {obj, id} = data
                canvas.getObjects().forEach(object => {
                    if (object.id === id) {
                        canvas.remove(object)
                    }
                })
            })
            
        }
    }, [canvas])

    const addToDic = (obj) => {
        const pastState = new objStack()
        if (obj.connectors) {
            pastState.push(obj.toObject(['id', 'connectors']))
        } else if (obj.type === 'group') {
            pastState.push(obj.toObject(['id', 'hidden']))
        } else if (obj.type === 'lineArrow') {
            pastState.push(obj.toObject(['id', 'fromPort', 'toPort', 'locations']))
        } else {
            pastState.push(obj.toObject(['id']))
        }
        const futureState = new objStack()
        objectDic[obj.id] = [pastState, futureState]
    }

    const modifyInDic = (obj) => {
        const info = objectDic[obj.id]
        const pastState = info[0]
        if (obj.connectors) {
            pastState.push(obj.toObject(['id', 'connectors']))
        } else if (obj.type === 'group') {
            pastState.push(obj.toObject(['id', 'hidden']))
        } else if (obj.type === 'lineArrow') {
            pastState.push(obj.toObject(['id', 'fromPort', 'toPort', 'locations']))
        } else {
            pastState.push(obj.toObject(['id']))
        }
        objectDic[obj.id] = [pastState, info[1]]
    }

    const removeInDic = (id) => {
        delete objectDic[id]
    }


    const addToState = (obj) => {
        wpState.push({action: 'add', object: obj})
        const pastState = new objStack()
        if (obj.connectors) {
            pastState.push(obj.toObject(['id', 'connectors']))
        } else if (obj.type === 'group') {
            pastState.push(obj.toObject(['id', 'hidden']))
        } else if (obj.type === 'lineArrow') {
            pastState.push(obj.toObject(['id', 'fromPort', 'toPort', 'locations']))
        } else {
            pastState.push(obj.toObject(['id']))
        }
        const futureState = new objStack()
        objectDic[obj.id] = [pastState, futureState]
    }

    const modifyInState = (obj) => {
        wpState.push({action: 'modify', object: obj})
        const info = objectDic[obj.id]
        const pastState = info[0]
        if (obj.connectors) {
            pastState.push(obj.toObject(['id', 'connectors']))
        } else if (obj.type === 'group') {
            pastState.push(obj.toObject(['id', 'hidden']))
        } else if (obj.type === 'lineArrow') {
            pastState.push(obj.toObject(['id', 'fromPort', 'toPort', 'locations']))
        } else {
            pastState.push(obj.toObject(['id']))
        }
        objectDic[obj.id] = [pastState, info[1]]
    }

    // const save = () => {
    //     redo = []
    //     if (wpState) {
    //         undo.push(wpState)
    //     }
    //     wpState = JSON.stringify(canvas)
    // }

    // const replay = (play, save) => {
    //     save.push(wpState)
    //     wpState = play.pop()
    //     canvas.clear()
    //     canvas.loadFromJSON(wpState, function() {
    //         canvas.renderAll()
    //     })
    // }

    const removeInState = (obj) => {
        wpState.push({action: 'remove', object: obj})
        modifyInDic(obj)
    }

    const getLast = () => {
        return wpState.pop()
    }

    const getLastFuture = () => {
        return wpFuture.pop()
    }

    const undo = () => {
        if (wpState.length === 0) {
            return
        }
        const pastState = getLast()
        console.log(objectDic[pastState.object.id])
        if (pastState.action === 'modify') {
            const info = objectDic[pastState.object.id]
            const pastStack = info[0]
            const futureStack = info[1]
            console.log(pastStack)
            console.log(futureStack)
            const curr = pastStack.pop()
            futureStack.push(curr)
            const obj = pastStack.peek()
            obj.id = pastState.object.id
            console.log(pastStack, futureStack)
            console.log(obj)
            objectDic[pastState.object.id] = [pastStack, futureStack]
            canvas.getObjects().forEach(object => {
                if (object.id === obj.id) {
                    object.set(obj)
                    object.setCoords()
                    const modifiedObj = {
                        obj: object,
                        id: object.id,
                      }
                    emitModify(modifiedObj)
                    canvas.renderAll()
                }
            })
        } else if (pastState.action === 'add') {
            const obj = pastState.object
            if (obj.type === 'group') {
                canvas.setActiveObject(obj)
                unGroup()
            } else if (obj.type === 'lineArrow') {
                canvas.remove(obj)
                canvas.forEachObject(function(o) {
                    if (o.connectors) {

                        if (o.connectors.hasOwnProperty('fromLine')) {
                            if (o.connectors.fromLine.includes(obj)) {
                                var idx = o.connectors.fromLine.indexOf(obj)
                                o.connectors.fromLine.splice(idx, 1)
                            }
                        }
            
                        if (o.connectors.hasOwnProperty('toLine')) {
                            if (o.connectors.toLine.includes(obj)) {
                                var idx = o.connectors.toLine.indexOf(obj)
                                o.connectors.toLine.splice(idx, 1)
                            }
                        }
                    }
                })
                emitRemoveConnector({obj: obj, id: obj.id})
                canvas.renderAll()
            } else {
                canvas.getObjects().forEach(object => {
                    if (object.id === obj.id) {
                        canvas.remove(object)
                        const modifiedObj = {
                            obj: object,
                            id: object.id,
                          }
                        emitDelete(modifiedObj)
                    }
                })
            }
        } else if (pastState.action === 'remove') {
            const obj = pastState.object
            if (obj.type === 'group') {
                var objIds = []
                var objectsInGroup = []
                const objs = obj._objects
                obj._restoreObjectsState()
                objs.forEach(function(o) {
                    canvas.forEachObject(function(ob) {
                        if (ob.id === o.id) {
                            objectsInGroup.push(ob)
                            objIds.push(ob.id)
                            canvas.remove(ob)
                        }
                    })
                })
        
                var group = new fabric.Group(objectsInGroup, {left: obj.left, top: obj.top, id: obj.id})
                canvas.add(group)
                canvas.renderAll()
                emitGroup({objectsInGroup: objIds, left: group.left, top: group.top, id: group.id, oriName: thisname})
            } else if (obj.type === 'lineArrow') {
                canvas.add(obj)
                canvas.forEachObject(function(o) {
                    if (o.id === obj.locations.fromObject && o.connectors) {
                        o.connectors.fromLine.push(obj)
                    } else if (o.id === obj.locations.toObject && o.connectors) {
                        o.connectors.toLine.push(obj)
                    }
                })
                canvas.renderAll()
                var points = [obj.x1, obj.y1, obj.x2, obj.y2]
                emitConnector({fromObject: obj.locations.fromObject, toObject: obj.locations.toObject, connectorLine: obj, fromPort: obj.fromPort, toPort: obj.toPort, oriName: thisname, id: obj.id, connectPoints: points})
            } else {
                canvas.add(obj)
                canvas.renderAll()
                emitAdd({obj: obj, id: obj.id, oriName: thisname})
            }

        }

        wpFuture.push(pastState)
        console.log(wpFuture)
        // objectDic[pastState.object.id] = [pastStack, futureStack]
        // canvas.getObjects().forEach(object => {
        //     if (object.id === obj.id) {
        //         object.set(obj)
        //         object.setCoords()
        //         canvas.renderAll()
        //     }
        // })
        // if (wpState.length > 0) {
        //     const pastState = wpState.slice(-1)[0]
        //     console.log(pastState)
        // if (pastState.action = "add") {
        //     const obj = pastState.object
        //     canvas.getObjects().forEach(object => {
        //     if (object.id === obj.id) {
        //         canvas.remove(object)
        //     }
        //     })
        // } else if (pastState.action === 'remove') {
        //     const obj = pastState.object
        //     canvas.add(obj)
        //     canvas.renderAll()
        // } else {
        //     objectDic[pastState.object.id] = [pastStack, futureStack]
        //     canvas.getObjects().forEach(object => {
        //         if (object.id === obj.id) {
        //             object.set(obj)
        //             object.setCoords()
        //             canvas.renderAll()
        //         }
        //     })
        // }

        // }
    }

    const redo = () => {
        if (wpFuture.length === 0) {
            return
        }

        const futureState = getLastFuture()
        if (futureState.action === 'add') {
            const obj = futureState.object
            if (obj.type === 'group') {
                var objIds = []
                var objectsInGroup = []
                const objs = obj._objects
                obj._restoreObjectsState()
                objs.forEach(function(o) {
                    canvas.forEachObject(function(ob) {
                        if (ob.id === o.id) {
                            objectsInGroup.push(ob)
                            objIds.push(ob.id)
                            canvas.remove(ob)
                        }
                    })
                })
        
                var group = new fabric.Group(objectsInGroup, {left: obj.left, top: obj.top, id: obj.id})
                canvas.add(group)
                canvas.renderAll()
                emitGroup({objectsInGroup: objIds, left: group.left, top: group.top, id: group.id, oriName: thisname})
            } else if (obj.type === 'lineArrow') {
                canvas.add(obj)
                canvas.forEachObject(function(o) {
                    if (o.id === obj.locations.fromObject && o.connectors) {
                        o.connectors.fromLine.push(obj)
                    } else if (o.id === obj.locations.toObject && o.connectors) {
                        o.connectors.toLine.push(obj)
                    }
                })
                canvas.renderAll()
                var points = [obj.x1, obj.y1, obj.x2, obj.y2]
                emitConnector({fromObject: obj.locations.fromObject, toObject: obj.locations.toObject, connectorLine: obj, fromPort: obj.fromPort, toPort: obj.toPort, oriName: thisname, id: obj.id, connectPoints: points})
            }
            canvas.add(obj)
            canvas.renderAll()
            emitAdd({obj: obj, id: obj.id, oriName: thisname})
        } else if (futureState.action === 'modify') {
            const info = objectDic[futureState.object.id]
            const pastStack = info[0]
            const futureStack = info[1]
            const curr = futureStack.pop()
            pastStack.push(curr)
            const obj = pastStack.peek()
            obj.id = futureState.object.id
            objectDic[futureState.object.id] = [pastStack, futureStack]
            canvas.getObjects().forEach(object => {
                if (object.id === obj.id) {
                    object.set(obj)
                    object.setCoords()
                    const modifiedObj = {
                        obj: object,
                        id: object.id,
                      }
                    emitModify(modifiedObj)
                    canvas.renderAll()
                }
            })
        } else if (futureState.action === 'remove') {
            const obj = futureState.object
            if (obj.type === 'group') {
                canvas.setActiveObject(obj)
                unGroup()
            } else if (obj.type === 'lineArrow') {
                canvas.remove(obj)
                canvas.forEachObject(function(o) {
                    if (o.connectors) {

                        if (o.connectors.hasOwnProperty('fromLine')) {
                            if (o.connectors.fromLine.includes(obj)) {
                                var idx = o.connectors.fromLine.indexOf(obj)
                                o.connectors.fromLine.splice(idx, 1)
                            }
                        }
            
                        if (o.connectors.hasOwnProperty('toLine')) {
                            if (o.connectors.toLine.includes(obj)) {
                                var idx = o.connectors.toLine.indexOf(obj)
                                o.connectors.toLine.splice(idx, 1)
                            }
                        }
                    }
                })
                emitRemoveConnector({obj: obj, id: obj.id})
                canvas.renderAll()
            } else {
                canvas.getObjects().forEach(object => {
                    if (object.id === obj.id) {
                        canvas.remove(object)
                        emitDelete(object)
                    }
                })
            }
        }

        wpState.push(futureState)
    }

    const updateConectors = (obj) => {
        if (obj.connectors) {
            var portCenter = null
            var i = null

            if (obj.connectors.hasOwnProperty('fromLine')) {
                i = 0
                obj.connectors.fromLine.forEach(function(line) {
                    portCenter = getPortCenter(obj, obj.connectors.fromPort[i])
                    line.set({'x1': portCenter.x1, 'y1': portCenter.y1})
                    i++
                })
            }

            if (obj.connectors.hasOwnProperty('toLine')) {
              i = 0
              obj.connectors.toLine.forEach(function(line) {
                  portCenter = getPortCenter(obj, obj.connectors.toPort[i])
                  line.set({'x2': portCenter.x2, 'y2': portCenter.y2})
                  i++
              })
            }

            canvas.renderAll()
        }
    }

    const moveFromLineArrows = (object, portCenter, index) => {
        var arrowOptions = {}
        removeObj(object.connectors.fromArrow[index], false)
        removeObj(object.connectors.toArrow[index], false)

        var x1 = portCenter.x1;
        var y1 = portCenter.y1;
        var x2 = object.connectors.fromLine[index].x2;
        var y2 = object.connectors.fromLine[index].y2;

        var otherObject = object.connectors.otherObject[index];

        arrowOptions.fill = 'ORANGE'

        var fromArrow = createArrow([x1, y1, x2, y2], arrowOptions)
        fromArrow.index = index;
        fromArrow.object = object;
        fromArrow.otherObject = otherObject;
        fromArrow.isFromArrow = true;
        fromArrow.port = fromArrow.object.connectors.toPort[index];
        fromArrow.line = fromArrow.object.connectors.fromLine[index];
        fromArrow.text = object.text + ' ' + fromArrow.port + ': ->';

        arrowOptions.fill = 'YELLOW'
        var toArrow = createArrow([ x2, y2, x1, y1 ], arrowOptions);
        toArrow.index = fromArrow.index;
        toArrow.object = fromArrow.object;
        toArrow.otherObject = fromArrow.otherObject;
        toArrow.isFromArrow = false;
        toArrow.port = fromArrow.object.connectors.fromPort[index];
        toArrow.line = fromArrow.line;
        toArrow.text = object.text + ' ' + toArrow.port + ': <-';

        object.connectors.fromArrow[index] = fromArrow;
        object.connectors.toArrow[index] = toArrow;

        otherObject.connectors.fromArrow[index] = fromArrow;
        otherObject.connectors.toArrow[index] = toArrow;
    }

    const moveToLineArrows = (object, portCenter, index) => {
        var arrowOptions = {}
        removeObj(object.connectors.fromArrow[index], false)
        removeObj(object.connectors.toArrow[index], false)

        var x1 = portCenter.x2;
        var y1 = portCenter.y2;
        var x2 = object.connectors.toLine[index].x1;
        var y2 = object.connectors.toLine[index].y1;

        var otherObject = object.connectors.otherObject[index];

        arrowOptions.fill = 'ORANGE'

        var fromArrow = createArrow([x2, y2, x1, y1], arrowOptions)
        fromArrow.index = index;
        fromArrow.object = otherObject;
        fromArrow.otherObject = object;
        fromArrow.isFromArrow = true;
        fromArrow.port = object.connectors.toPort[index];
        fromArrow.line = object.connectors.fromLine[index];
        fromArrow.text = otherObject.text + ' ' + fromArrow.port + ': ->';

        arrowOptions.fill = 'YELLOW'
        var toArrow = createArrow([ x1, y1, x2, y2 ], arrowOptions);
        toArrow.index = fromArrow.index;
        toArrow.object = fromArrow.object;
        toArrow.otherObject = fromArrow.otherObject;
        toArrow.isFromArrow = false;
        toArrow.port = object.connectors.fromPort[index];
        toArrow.line = fromArrow.line;
        toArrow.text = otherObject.text + ' ' + toArrow.port + ': <-';

        object.connectors.fromArrow[index] = fromArrow;
        object.connectors.toArrow[index] = toArrow;

        otherObject.connectors.fromArrow[index] = fromArrow;
        otherObject.connectors.toArrow[index] = toArrow;
    }

    const removeObj = (obj, bool) => {
        canvas.remove(obj)
        if (bool) {
            canvas.renderAll()
        }
    }

    const panningMode = () => {
        panMode.current = true
        canvas.forEachObject(function(obj) {
            obj.evented = false
            obj.selectable = false
        })

        canvas.selection = false
    }

    const addConnector = (points) => {
        const c = new Connector(points)
        c.set({id: uuid()})
        return addToCanvas(c, false)
    }

    const removeConnector = () => {
        var activeObj = canvas.getActiveObject()
        canvas.forEachObject(function(o) {
            if (o.connectors) {

                if (o.connectors.hasOwnProperty('fromLine')) {
                    if (o.connectors.fromLine.includes(activeObj)) {
                        var idx = o.connectors.fromLine.indexOf(activeObj)
                        o.connectors.fromLine.splice(idx, 1)
                    }
                }
    
                if (o.connectors.hasOwnProperty('toLine')) {
                    if (o.connectors.toLine.includes(activeObj)) {
                        var idx = o.connectors.toLine.indexOf(activeObj)
                        o.connectors.toLine.splice(idx, 1)
                    }
                }
            }
        })
        canvas.remove(activeObj)
        emitRemoveConnector({obj: activeObj, id: activeObj.id})
        removeInState(activeObj)
        canvas.renderAll()

    }

    const createArrow = (points, options) => {
        var x1 = points[0];
        var y1 = points[1];
        var x2 = points[2];
        var y2 = points[3];

        var dx = x2 - x1;
        var dy = y2 - y1;

        var angle = Math.atan2(dy, dx);
        angle *= 180 / Math.PI;
        angle += 90;
        options.left = x2;
        options.top = y2;
        options.angle = angle;
        var object = addTriangle(options);
        object.set('type', 'arrow');
        object.set({id: uuid()})
        object.index = 0;
        object.object = {};
        object.otherObject = {};
        object.isFromArrow = true;
        object.port = 'mt';
        object.line = {};

        return object;

    }

    const addTriangle = (options) => {
        const t = new fabric.Triangle(options)
        t.set({id: uuid()})
        return addToCanvas(t, false)
    }

    const addToCanvas = (obj, bool) =>{
        canvas.add(obj)
        if (bool) {
            canvas.renderAll()
        }
        return obj
    }

    const addRect = () => {
        console.log('i')
        const rect = new fabric.Rect({height: 300, width: 300, borderColor: 'black', fill: '#fdfd96'})
        rect.set({id: uuid()})
        canvas.add(rect)
        canvas.renderAll()
        addToState(rect)
        emitAdd({obj: rect, id: rect.id, oriName: thisname})
    }

    const addTri = () => {
        const rect = new fabric.Triangle({height: 200, width: 150, fill: '#fdfd96', borderColor: 'black'})
        rect.set({id: uuid()})
        canvas.add(rect)
        canvas.renderAll()
        addToState(rect)
        emitAdd({obj: rect, id: rect.id, oriName: thisname})

    }

    const addEllispe = () => {
        const rect = new fabric.Ellipse({rx: 150, ry: 75, fill: '#fdfd96', strokeWidth: 2, stroke: 'black'})
        rect.set({id: uuid()})
        canvas.add(rect)
        canvas.renderAll()
        addToState(rect)
        emitAdd({obj: rect, id: rect.id, oriName: thisname})
    }

    const addRoundedRect = () => {
        const rect = new fabric.Rect({height: 300, width: 300, borderColor: 'black', fill: '#fdfd96', rx: 40, ry: 40})
        rect.on('scaling', function() {
            this.set({
                width: this.width * this.scaleX,
                height: this.height * this.scaleY,
                scaleX: 1,
                scaleY: 1
            })
        })
        rect.set({id: uuid()})
        canvas.add(rect)
        canvas.renderAll()
        addToState(rect)
        emitAdd({obj: rect, id: rect.id, oriName: thisname})
    }

    const addDiamond = () => {
        var points = [{x: 100, y: 100},{x: 200, y: 200}, {x: 300, y: 100}, {x: 200, y: 0}]
        const rect = new fabric.Polygon(points, {fill: '#fdfd96', borderColor: 'black'})
        rect.set({id: uuid()})
        canvas.add(rect)
        canvas.renderAll()
        addToState(rect)
        emitAdd({obj: rect, id: rect.id, oriName: thisname})
    }

    const addParellogram = () => {
        var points = [{x: 300, y: 100}, {x: 340, y: 300}, {x: 140, y: 300}, {x: 100, y: 100}]
        const rect = new fabric.Polygon(points, {borderColor: 'black', fill: '#fdfd96'})
        rect.set({id: uuid()})
        canvas.add(rect)
        canvas.renderAll()
        addToState(rect)
        emitAdd({obj: rect, id: rect.id, oriName: thisname})
    }

    
    const createGroup = (canvi, objs) => {
        var activeObj = canvas.getActiveObject();
        var left = activeObj.left
        var top = activeObj.top
        var objIds = []
        var objectsInGroup = activeObj._objects
        objectsInGroup.forEach((obj) => {
            objIds.push(obj.id)
            canvas.remove(obj)
        })

        var group = new fabric.Group(objectsInGroup, {left: left, top: top, id: uuid(), hidden: false})
        console.log(group.id)
        canvas.add(group)
        canvas.renderAll()
        addToState(group)
        emitGroup({objectsInGroup: objIds, left: left, top: top, id: group.id, oriName: thisname})
    }

    const duplicate = () => {

        // const types = ['rect', 'triangle', 'textbox', 'ellispe', 'polygon', 'path']
        // var activeObj = canvas.getActiveObject();
        // var left = activeObj.left
        // var top = activeObj.top
        // var objIds = []
        // var objectsInGroup = activeObj._objects
        // objectsInGroup.forEach((obj) => {
        //     objIds.push(obj.id)
        //     canvas.remove(obj)
        // })

        // var group = new fabric.Group(objectsInGroup, {left: left, top: top, id: uuid()})
        // console.log(group.id)
        // canvas.add(group)
        // canvas.renderAll()
        // addToState(group)
        // emitGroup({objectsInGroup: objIds, left: left, top: top, id: group.id, oriName: thisname})

        // var objIds = []
        //         var objectsInGroup = []
        //         const objs = obj._objects
        //         obj._restoreObjectsState()
        //         objs.forEach(function(o) {
        //             canvas.forEachObject(function(ob) {
        //                 if (ob.id === o.id) {
        //                     objectsInGroup.push(ob)
        //                     objIds.push(ob.id)
        //                     canvas.remove(ob)
        //                 }
        //             })
        //         })
        
        //         var group = new fabric.Group(objectsInGroup, {left: obj.left, top: obj.top, id: obj.id})
        //         canvas.add(group)
        //         canvas.renderAll()
        //         emitGroup({objectsInGroup: objIds, left: group.left, top: group.top, id: group.id, oriName: thisname})

        const obj = canvas.getActiveObject()
        var dup = null
        if (obj.type === 'group') {
            const objs = obj._objects
            var objIds = []
            var group = new fabric.Group()
            objs.forEach(function(o) {
                var l = obj.left - obj.width/2
                var t = obj.top - obj.height/2
                var singleDup = null
                if (o.type === 'rect') {
                    singleDup = new fabric.Rect()
                } else if (o.type === 'textbox') {
                    singleDup = new fabric.Textbox('')
                } else if (o.type === 'triangle') {
                    singleDup = new fabric.Triangle()
                } else if (o.type === 'ellispe') {
                    singleDup = new fabric.Ellipse()
                } else if (o.type === 'polygon') {
                    singleDup = new fabric.Polygon()
                } else {
                    singleDup = new fabric.Path()
                }
    
                singleDup.set(o)
                singleDup.set({id: uuid()})
                if (o.left === l || o.left + o.width === l + obj.width){
                    console.log(o.type)
                    singleDup.set({left: o.left + o.width + 50, top: o.top})
                } else {
                    console.log(o.type)
                    singleDup.set({left: o.left + obj.width + 50, top: o.top})
                }
                objIds.push(singleDup.id)
                canvas.add(singleDup)
                addToState(singleDup)
                emitAdd({obj: singleDup, id: singleDup.id, oriName: thisname})
                group.addWithUpdate(singleDup)
                canvas.remove(singleDup)

            })

            group.set({id: uuid()})
            group.set({left: obj.left + obj.width + 50})
            group.set({top: obj.top})
            canvas.add(group)
            canvas.renderAll()
            addToState(group)
            emitGroup({objectsInGroup: objIds, left: group.left, top: group.top, id: group.id, oriName: thisname})

        } else {
            if (obj.type === 'rect') {
                dup = new fabric.Rect()
            } else if (obj.type === 'textbox') {
                dup = new fabric.Textbox('')
            } else if (obj.type === 'triangle') {
                dup = new fabric.Triangle()
            } else if (obj.type === 'ellispe') {
                dup = new fabric.Ellipse()
            } else if (obj.type === 'polygon') {
                dup = new fabric.Polygon()
            } else {
                dup = new fabric.Path()
            }

            dup.set(obj)
            dup.set({id: uuid()})
            dup.set({left: obj.left + obj.width + 50, top: obj.top})
            addToState(dup)
            canvas.add(dup)
            emitAdd({obj: dup, id: dup.id, oriName: thisname})
        }
    }

    const addImage = (e) => {
        console.log(e)
        var reader = new FileReader();
        reader.onload = function (event){
            var imgObj = new Image();
            imgObj.src = event.target.result;
            imgObj.onload = function () {
                var image = new fabric.Image(imgObj);
                image.set({id: uuid()})
                console.log(image.type)
                canvas.add(image);
                canvas.renderAll();
                emitAdd({obj: image, id: image.id, oriName: thisname})
            }
        }
        reader.readAsDataURL(e.target.files[0]);

    }

    const unGroup = () => {
        var activeObj = canvas.getActiveObject();
        var objId = activeObj.id
        var objectsInGroup = activeObj._objects
        activeObj._restoreObjectsState()
        activeObj.set({hidden: true})
        removeInState(activeObj)
        canvas.remove(activeObj)
        for (var i = 0; i < objectsInGroup.length; i++) {
            console.log(objectsInGroup[i].id)
            canvas.add(objectsInGroup[i])
            objectsInGroup[i].dirty = true
            canvas.item(canvas.size()-1).hasControls = true;
        }
        canvas.renderAll()
        emitUngroup({id: objId, oriName: thisname})
    }

    const toggleConnectorMode = () => {
        connectorMode.current = true
    }

    const addSticky = (canvi) => {
        console.log('i')
        const rect = new fabric.StickyNote({width: 100,
            height: 100,
            originX: 'center',
            originY: 'center',
            fill: '#f5df16',
            stroke: '#f5df16',
            strokeWidth: 2,
            label: 'Edit me',
            rx: 5,
            ry: 5})
        rect.set({id: uuid()})
        canvi.add(rect)
        canvi.renderAll()
        // emitAdd({obj: rect, id: rect.id})
    }

    const addText = (canvi) => {
        console.log('i')
        const textbox = new fabric.Textbox('', {
            fontFamily: 'sans-serif',
            fill: 'black',
            transparentCorners: false,
            borderColor: '#0E98FC',
            cornerColor: '#0E98FC',
            centeredScaling: false,
            borderOpacityWhenMoving: 1,
            lockScalingFlip: true,
            lockSkewingX: true,
            lockSkewingY: true,
            cursorWidth: 1,
            cursorDuration: 1,
            cursorDelay: 250
        });
        textbox.set({id: uuid()})
        console.log(textbox)
        canvas.add(textbox).setActiveObject(textbox)
        canvas.renderAll()
        textbox.enterEditing()
        addToState(textbox)
        emitAdd({obj: textbox, id: textbox.id, oriName: thisname})
    }

    const drawMode = () => {
        connectorMode.current = false
        canvas.isDrawingMode = true
        if (panMode.current) {
            panMode.current = false
            canvas.forEachObject(function(obj) {
                obj.evented = true
                obj.selectable = true
            })
    
            canvas.selection = true
        }
        canvas.freeDrawingBrush.width = 5
        canvas.freeDrawingBrush.color = 'black'
    }

    const emitAdd = (data) => {
        var jsonCanvas = JSON.stringify(canvas)
        socket.emit('object-added', {data, room, objectDic})
    }

    const emitModify = (data) => {
        var jsonCanvas = JSON.stringify(canvas)
        socket.emit('object-modified', {data, room, objectDic})
    }

    const emitGroup = (data) => {
        var jsonCanvas = JSON.stringify(canvas)
        socket.emit('group-added', {data, room, objectDic})
    }

    const emitUngroup = (data) => {
        var jsonCanvas = JSON.stringify(canvas)
        socket.emit('ungroup', {data, room, objectDic})
    }

    const emitConnector = (data) => {
        var jsonCanvas = JSON.stringify(canvas)
        socket.emit('add-connector', {data, room, objectDic})
    }

    const emitRemoveConnector = (data) => {
        var jsonCanvas = JSON.stringify(canvas)
        socket.emit('remove-connector', {data, room, objectDic})
    }

    const emitPositionChange = (option, data) => {
        var jsonCanvas = JSON.stringify(canvas)
        if (option === 'back') {
            modifyInState(data.obj)
            socket.emit('object-pushBack', {data, room, objectDic})
        } else {
            modifyInState(data.obj)
            socket.emit('object-pushFront', {data, room, objectDic})
        }
    }

    const emitDelete = (data) => {
        var jsonCanvas = JSON.stringify(canvas)
        socket.emit('object-delete', ({data, room, objectDic}))
    }

    const disconnect = () => {
        socket.disconnect()
        // return history.push('/')
        // // return <Redirect to={`/`} />
    }

    const selectMode = () => {
        canvas.isDrawingMode = false
        if (panMode.current) {
            panMode.current = false
            canvas.forEachObject(function(obj) {
                obj.evented = true
                obj.selectable = true
            })
    
            canvas.selection = true
        }
        connectorMode.current = false
    }

    const onResize = (width, height) => {
        canvas.setHeight(height)
        canvas.setWidth(width)
        canvas.renderAll()
    }

    return (
        <Flex direction="column" h="100vh" overflow="hidden" bg="white" color="inherit">
            <Flex flex="1 0" minH={0}>
                <Container w="xs" bgColor="#f3f3f3" overflowY="auto" maxW="full" lineHeight={1.4} py={4}>
                    <Heading mt={4} mb={1.5} size="sm">
                        Room Code
                    </Heading>
                    <InputGroup size="sm">
                        <Input readOnly pr="3.5rem" variant="outline" bgColor="white" borderColor="white" value={room} />
                        <InputRightElement width="3.5rem">
                            <Button h="1.4rem" size="xs" onClick={() => handleCopy()} _hover={{bg: "gray.200"}} bgColor="gray.200">
                                Copy
                            </Button>
                        </InputRightElement>
                    </InputGroup>

                    <Heading mt={4} mb={1.5} size="sm">
                        Active Users
                    </Heading>
                    <Stack spacing={0} mb={1.5} fontSize="sm">
                        {users.map((name) => (
                            console.log(name),
                            <User name={name} />
                        ))}
                    </Stack>
                    <Button bg='red' marginTop={5} width='100%' onClick={() => disconnect()}>
                        Disconnect
                    </Button>
                </Container>
                <Flex flex={1} minW={0} h="100%" direction="column" overflow="hidden">
                    <Toolbar addRect={addRect} canvas={canvas} addText={addText} draw={drawMode} select={selectMode} active={active} emitModify={emitModify} emitPositionChange={emitPositionChange} emitDelete={emitDelete} addSticky={addSticky} toggleConnectorMode={toggleConnectorMode} undo={undo} redo={redo} removeInState={removeInState} createGroup={createGroup} unGroup={unGroup} addImage={addImage} panningMode={panningMode} removeConnector={removeConnector} addTri={addTri} addEllispe={addEllispe} addRoundedRect={addRoundedRect} addDiamond={addDiamond} addParellogram={addParellogram} duplicate={duplicate}/>
                    <ResponsiveCanvas setCanvas={setCanvas} onResize={onResize} emitModify={emitModify}/>
                </Flex>
            </Flex>
        </Flex>
    )
}

export default WhitePadPage