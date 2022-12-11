import React, {Component} from "react";
import {DragDropContext, Droppable, Draggable} from "react-beautiful-dnd";
import './portrait.scss'
import TextureSelector from "../../components/Portrait/TextureSelector";
import {ColorPickerPopout} from "../../components/Portrait/ColorPickerPopout";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export class DragContainer extends Component {
  constructor(props) {
    super(props);
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    const items = reorder(
      this.props.layers,
      result.source.index,
      result.destination.index
    );
    this.props.setLayers(items)
  }

  // Normally you would want to split things out into separate components.
  // But in this example everything is just done in one place for simplicity
  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {this.props.layers.map((layer, index) => (
                <Draggable key={layer.id} draggableId={layer.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <div className="entryItem itemBkg no-select" key={layer.id}>
                        <div className="move-prompt">
                          ↕
                        </div>
                        <ColorPickerPopout
                          contenteditable
                          changeColor={(newColor) => { layer.color = newColor }}
                        />
                        <button className="selectContainer" onClick={()=>{}}>
                          <TextureSelector
                            contenteditable
                            changeTexture={(newTexture, configId) => {
                            layer.texture = newTexture
                            layer.configId = configId
                          }}/>
                        </button>
                        <button
                          className="delete"
                          onClick={() => { deleteLayer(layer)}}
                        >
                          🗑
                        </button>
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
}