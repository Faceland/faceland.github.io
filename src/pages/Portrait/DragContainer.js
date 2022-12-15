import React, {Component, useContext} from "react";
import {DragDropContext, Droppable, Draggable} from "react-beautiful-dnd";
import './portrait.scss'
import TextureSelector from "../../components/Portrait/TextureSelector";
import {ColorPickerPopout} from "../../components/Portrait/ColorPickerPopout";
import {Context} from "../../Store";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const DragContainer = (props) => {

  const [state] = useContext(Context);

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    const items = reorder(
      props.layers,
      result.source.index,
      result.destination.index
    );
    props.setLayers(items)
  }

  const MoveButton = () => {
    return <div className="move-prompt">↕</div>
  }

  const DeleteButton = (layer) => {
    return <button className="delete" onClick={() => {props.deleteLayer(layer)}}>🗑</button>
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {props.layers.map((layer, index) => (
              <Draggable className="no-select" key={layer.id} draggableId={layer.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <div className="entryItem itemBkg" key={layer.id}>
                      {state.mobile ? <DeleteButton layer={layer}/> : <MoveButton/>}
                      <ColorPickerPopout
                        layer={layer}
                        changeColor={(newColor) => {
                          layer.color = newColor
                          props.updateLayers()
                        }}
                      />
                      <button className="selectContainer" onClick={() => {
                      }}>
                        <TextureSelector
                          layer={layer}
                          changeOptions={(options) => {
                            layer.selection = undefined
                            layer.options = options
                            props.updateLayers()
                          }}
                          changeTexture={(selection) => {
                            layer.selection = selection
                            props.updateLayers()
                          }}
                        />
                      </button>
                      {state.mobile ? <MoveButton/> : <DeleteButton layer={layer}/>}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}