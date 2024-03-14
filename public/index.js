import {Menu, MENU_RENDER_TYPES} from "./components/Menu/Menu.js";

const rootElement = document.getElementById('root');

const link = 'http://127.0.0.1:5000';
const buildingId = '8250b9ba-bc0d-4d2f-abf7-d91265e89050'

async function getFloorNumbersAndUUIDs() {
  let response = await fetch(`${link}/floors/${buildingId}`);
  let json = await response.json();
  const transformed = json.reduce((acc, item) => {
    acc.floors[item.floor_number] = {
        floor_uuid: item.uuid,
        floor_number: item.floor_number.toString(),
    };
    return acc;
}, { floors: {} });
return transformed
}

const floorsList = await getFloorNumbersAndUUIDs();

const menu = new Menu(rootElement, floorsList);

function renderMenu() {
    menu.render(MENU_RENDER_TYPES.TEMPLATE);
}

class FloorState {
    constructor() {
        this.globalState = {}
    }

    setFloorState(floor, key, value) {
        this.globalState[floor] = this.globalState[floor] || {};
        this.globalState[floor][key] = value;
    }

    pushDelayedRender(floor, value) {
        this.globalState[floor] = this.globalState[floor] || {};
        this.globalState[floor]['delayed_display'] = this.globalState[floor]['delayed_display'] || [];
        this.globalState[floor]['delayed_display'].push(value);
    }

   
    getFloorState(floor, key) {
        return this.globalState[floor] ? this.globalState[floor][key] : undefined;
    }

    resetFloorState(key) {
        for (let floor in this.globalState) {
            if (this.globalState[floor].hasOwnProperty(key)) {
                delete this.globalState[floor][key];
            }
        }
    }

    resetFloorStateForFloor(floor, key) {
       
        delete this.globalState[floor][key];
       
    }
}


const state = new FloorState();
let currentFloorUUID = -1;
let isSelectFilled = false;
const SVG = document.getElementById('svg');
const selectFrom = document.getElementById('select-from');
const selectTo = document.getElementById('select-to');

async function handleSearch() {
  const data = state.getFloorState(currentFloorUUID, 'json_coordinates');
  renderPolygons(data, currentFloorUUID, true);
  state.resetFloorState('delayed_display');   
  for (const floorNumber in floorsList.floors) {
    if (floorsList.floors.hasOwnProperty(floorNumber)) {
        const floorUUID = floorsList.floors[floorNumber].floor_uuid;
        if (floorUUID != currentFloorUUID){
          state.setFloorState(floorUUID, 'need_clear', true)
          
        } 
    }
  }

  const pathFrom = selectFrom.value;
  const pathTo = selectTo.value;

  const path = await getPath(pathFrom, pathTo);
  path.path.forEach((item) => {
    if (currentFloorUUID == item.floor_uuid) {
        const el = document.getElementById(`bp_id_${item.basenode_uuid}`);
        el.setAttribute('class', 'isSelectedHall');
    } else {
    state.pushDelayedRender(item.floor_uuid, item.basenode_uuid)
    }
  
  })
  const from = path.from;
  const to = path.to;

  for (const floorNumber in floorsList.floors) {
    if (floorsList.floors.hasOwnProperty(floorNumber)) {
        const floorUUID = floorsList.floors[floorNumber].floor_uuid;
        console.log(floorUUID);
        const elementFloorNumber = document.getElementById(floorUUID);
        if (floorUUID == from.floor_uuid){
            elementFloorNumber.setAttribute('class', 'selected_floor_text');
        } else if (floorUUID == to.floor_uuid) {
            elementFloorNumber.setAttribute('class', 'selected_floor_text');
        } else if (elementFloorNumber.classList.contains('selected_floor_text')) {
            elementFloorNumber.classList.remove('selected_floor_text');
        }
    }
  }

//   const fromFloorNumber = document.getElementById(from.floor_uuid);
//   const toFloorNumber = document.getElementById(to.floor_uuid);
  
//   fromFloorNumber.setAttribute('class', 'selected_floor_text');
//   toFloorNumber.setAttribute('class', 'selected_floor_text');
  
  if (currentFloorUUID == from.floor_uuid) {
      const departure = document.getElementById(`r_id_${from.room_uuid}`);
      departure.setAttribute('class', 'isSelectedAud');
  } else {
    state.setFloorState(from.floor_uuid, 'departure', from.room_uuid) 
  }

  if (currentFloorUUID == to.floor_uuid) {
      const destination = document.getElementById(`r_id_${to.room_uuid}`);
      destination.setAttribute('class', 'isSelectedAud');
  } else {
      state.setFloorState(to.floor_uuid, 'destination', to.room_uuid) 
  }
}

function delayedRender(floor_uuid) {
    const roomArray = state.getFloorState(floor_uuid, 'delayed_display')
    if (typeof roomArray !== "undefined") {
        roomArray.forEach((basenode_uuid) => {
            const el = document.getElementById(`bp_id_${basenode_uuid}`);
            el.setAttribute('class', 'isSelectedHall');
        })
        state.resetFloorStateForFloor(floor_uuid, 'delayed_display', )
    } 
    
    const departureState = state.getFloorState(floor_uuid, 'departure')
    if (typeof departureState !== "undefined") {
        const departure = document.getElementById(`r_id_${departureState}`);
        departure.setAttribute('class', 'isSelectedAud');
        state.resetFloorStateForFloor(floor_uuid, 'departure', )
    }

    const destinationState = state.getFloorState(floor_uuid, 'destination')
    if (typeof destinationState !== "undefined") {
        const destination = document.getElementById(`r_id_${destinationState}`);
        destination.setAttribute('class', 'isSelectedAud');
        state.resetFloorStateForFloor(floor_uuid, 'destination', )
    }
  
}

const searchButton = document.getElementById('search_path');
searchButton.addEventListener('click', handleSearch)

async function getPath(from, to) {
    let response = await fetch(`${link}/get_path?from=${from}&to=${to}`);
    if (response.ok) { 
        let json = await response.json();
        return json;
      } else {
        alert("Ошибка HTTP: " + response.status);
      }
}

function removeOptions(selectElement) {
    var i, L = selectElement.options.length - 1;
    for(i = L; i >= 0; i--) {
       selectElement.remove(i);
    }
 }


async function requestDataByFloor(floorId) {
    console.log(`request data for ${floorId}`);
    let response = await fetch(`${link}/floors/get_all?floor_uuid=${floorId}`);
    let responseRooms = await fetch(`${link}/get_all_rooms_in_the_building?uuid=${buildingId}`);
    
    if (response.ok) { 
        let json = await response.json();
        let jsonRooms = await responseRooms.json()

        let basenodesJson = json.basenode;
        let roomsJsonSelect = jsonRooms.rooms;
        let roomsJson = json.rooms;

        const basenodesPolygonCoordinates = processPolygonCoordinates(basenodesJson, 'bp_id_');
        const roomPolygonCoordinates = processPolygonCoordinates(roomsJson, 'r_id_');

        return {
            "coordinates" : [...basenodesPolygonCoordinates, ...roomPolygonCoordinates],
            "select" : roomsJsonSelect
        };
    } else {
        alert("Ошибка HTTP: " + response.status);
    } 
}

const processPolygonCoordinates = (data, idPrefix) => 
    Object.values(data).map(p => {
        const coord = Object.keys(p.coordinates).map(key => [p.coordinates[key].x, p.coordinates[key].y]);
        if (idPrefix == 'r_id_') {
          return { uuid: `${idPrefix}${p.uuid}`, coordinates: coord, displayed_name: p.displayed_name };
        }
        return { uuid: `${idPrefix}${p.uuid}`, coordinates: coord, basenode_type: p.basenode_type};
    });

async function handleClickFloorBtn(e) {
    console.log('handle click');
    const floorNum = e.target.value;
    currentFloorUUID = floorNum
    let data = state.getFloorState(floorNum, 'json_coordinates');

    if (!data) {
        data = await requestDataByFloor(floorNum);
        state.setFloorState(floorNum, 'json_coordinates', data);
        
    }

    const needClear = state.getFloorState(floorNum, 'need_clear')
    if (typeof needClear !== "undefined")
    {
      renderPolygons(data, floorNum, needClear);
      state.setFloorState(floorNum, 'need_clear', false)
    } else {
      renderPolygons(data, floorNum, needClear);
    }
    
}

function createTextElement(x, y, textAnchor, fill, fontSize, textContent) {
  const SVG_NS = "http://www.w3.org/2000/svg";
  let textElement = document.createElementNS(SVG_NS, "text");
  textElement.setAttributeNS(null, "x", x);
  textElement.setAttributeNS(null, "y", y);
  textElement.setAttributeNS(null, "text-anchor", textAnchor);
  textElement.setAttributeNS(null, "fill", fill);
  textElement.setAttributeNS(null, "font-size", fontSize);
  textElement.textContent = textContent;
  return textElement;
 }

 function findPolygonCenter(vertices) {
  let numVertices = vertices.length;
  
  let sumX = 0;
  let sumY = 0;
  
  for (let i = 0; i < vertices.length; i++) {
      sumX += parseInt(vertices[i][0]); // Преобразование строки в число
      sumY += parseInt(vertices[i][1]); // Преобразование строки в число
  }
  
  let centerX = sumX / numVertices;
  let centerY = sumY / numVertices;
  
  return { x: centerX, y: centerY };
}

function calculatePolygonWidthAndHeight(coordinates) {
  // Проверяем, что массив содержит хотя бы одну координату
  if (coordinates.length < 1) {
      throw new Error("Недостаточно координат для определения многоугольника.");
  }

  // Извлекаем координаты x и y
  const xCoordinates = coordinates.map(point => point[0]);
  const yCoordinates = coordinates.map(point => point[1]);

  // Вычисляем минимальные и максимальные значения координат x и y
  const minX = Math.min(...xCoordinates);
  const maxX = Math.max(...xCoordinates);
  const minY = Math.min(...yCoordinates);
  const maxY = Math.max(...yCoordinates);

  // Вычисляем ширину и высоту многоугольника
  const width = maxX - minX;
  const height = maxY - minY;

  return { width, height };
}

function fontSizeProcessor(polygonSize) {
  const width = polygonSize.width;
  
  if (width > 60) {
    return 20
  }

  return width / 3.2;
     
 }


// рендеринг полиногов
function renderPolygons(polygonsData, floorNum, resetFloor) {
    console.log('data rendering');
    const floorNode = document.getElementById('floor');
    
    let renderedState = state.getFloorState(floorNum, 'planDOM');
    if (!renderedState || resetFloor) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute('id', 'floor')
        for (const d of polygonsData.coordinates) {
            let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            
            const polygonCenter = findPolygonCenter(d.coordinates)
            polygon.setAttribute('points', d.coordinates);
            polygon.setAttribute('class', '');
            polygon.setAttribute('id', d.uuid);

            if (d.uuid.charAt(0) == 'r'){
                polygon.setAttribute('class', 'isAud');
                polygon.addEventListener('mouseover', function(e) {  
                    this.style.fill = '#83bfd3';  
                });

                polygon.addEventListener('mouseout', function() { 
                    this.style.fill = '#ADD8E6';  
                });
            } else if (d.basenode_type == 'Лестница' || d.basenode_type == 'Лифт') {
                polygon.setAttribute('class', 'isElevatorOrStairs');
            } else {
                polygon.setAttribute('class', 'isHall');
            }
            g.appendChild(polygon);
           
            if (d.uuid.charAt(0) == 'r'){
              const textElement = createTextElement(polygonCenter.x, polygonCenter.y, "middle", "black", fontSizeProcessor(calculatePolygonWidthAndHeight(d.coordinates)), d.displayed_name);
              
              g.appendChild(textElement);
            } else if (d.basenode_type == 'Лестница') {
                let pngImage = document.createElementNS("http://www.w3.org/2000/svg","image");
                const imageSize = 30;
                pngImage.setAttribute("x", polygonCenter.x - imageSize / 2);
                if (d.uuid !== 'bp_id_6291b50f-05b6-45f4-a41b-fbb4c9e5c961' && d.uuid !=='bp_id_2747844c-a00c-403d-8b3d-26d2a80171e5') {
                    pngImage.setAttribute("y", polygonCenter.y - imageSize / 2);
                } else if (d.uuid ==='bp_id_2747844c-a00c-403d-8b3d-26d2a80171e5'){
                    pngImage.setAttribute("y", 210);
                } else {
                    pngImage.setAttribute("y", 215);
                }
                pngImage.setAttribute("width", imageSize);
                pngImage.setAttribute("height", imageSize);
                pngImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", "stair.svg");
                g.appendChild(pngImage);
            } else if (d.basenode_type == 'Лифт') {
                let pngImage = document.createElementNS("http://www.w3.org/2000/svg","image");
                const imageSize = 30;
                pngImage.setAttribute("x", polygonCenter.x - imageSize / 2);
                pngImage.setAttribute("y", polygonCenter.y - imageSize / 2);
                pngImage.setAttribute("width", imageSize);
                pngImage.setAttribute("height", imageSize);
                pngImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", "elevator.svg");
                g.appendChild(pngImage);
            }
        }
        floorNode.replaceWith(g);
        delayedRender(floorNum)
        state.setFloorState(floorNum, 'planDOM', g);  
    } else {
        floorNode.replaceWith(renderedState);
        delayedRender(floorNum)
        state.setFloorState(floorNum, 'planDOM', renderedState); 
    }

    //removeOptions(selectFrom);
    //removeOptions(selectTo);

    if (!isSelectFilled) {
        for (let item of polygonsData.select) {
            const option_text = item.displayed_name;
            const option_id = item.uuid;
            
            const optionFrom = document.createElement("option");
            optionFrom.appendChild(document.createTextNode(option_text));
            optionFrom.setAttribute("value", option_id);
            selectFrom.appendChild(optionFrom);
            
            const optionTo = document.createElement("option");
            optionTo.appendChild(document.createTextNode(option_text));
            optionTo.setAttribute("value", option_id);
            selectTo.appendChild(optionTo);
        }
        isSelectFilled = true
    }
}

async function bootstrap() {
    const floorBtn = document.querySelectorAll('.floor_btn');
    floorBtn.forEach((b) => {
        b.addEventListener('click', handleClickFloorBtn);
    })
}

async function initialFloor() {
    console.log('handle click');
    const floorNum = '2d37f5c4-9d6c-4e28-ae66-40a1f3e3347f';
    currentFloorUUID = floorNum
    let data = state.getFloorState(floorNum, 'json_coordinates');

    if (!data) {
        data = await requestDataByFloor(floorNum);
        state.setFloorState(floorNum, 'json_coordinates', data);
        
    }

    renderPolygons(data, floorNum, false);
}

renderMenu();
bootstrap();
await initialFloor();

const radioBtn = document.querySelector('.floor_btn');
radioBtn.checked = true;


