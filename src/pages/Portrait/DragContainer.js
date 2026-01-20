import React, { useContext, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './portrait.scss';
import TextureSelector from '../../components/Portrait/TextureSelector';
import { ColorPickerPopout } from '../../components/Portrait/ColorPickerPopout';
import { Context } from '../../Store';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const DragContainer = (props) => {
  const [state] = useContext(Context);
  const [activePickerId, setActivePickerId] = useState(null);

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    const items = reorder(
      props.layers,
      result.source.index,
      result.destination.index,
    );
    props.setLayers(items);
  };

  const MoveIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M12 2L8 6h3v4H7V7l-4 4 4 4v-3h4v4H8l4 4 4-4h-3v-4h4v3l4-4-4-4v3h-4V6h3L12 2z"/>
    </svg>
  );

  const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  );

  const MoveButton = () => {
    return <div className="move-prompt"><MoveIcon /></div>;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {props.layers.map((layer, index) => (
              <Draggable
                className="no-select"
                key={layer.id}
                draggableId={layer.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <div className="entryItem itemBkg" key={layer.id}>
                      {state.mobile ? (
                        <button
                          className="delete"
                          onClick={() => props.deleteLayer(layer)}
                        >
                          <TrashIcon />
                        </button>
                      ) : (
                        <MoveButton />
                      )}
                      <ColorPickerPopout
                        layer={layer}
                        isOpen={activePickerId === layer.id}
                        onToggle={(isOpen) => setActivePickerId(isOpen ? layer.id : null)}
                        changeColor={(newColor) => {
                          layer.color = newColor;
                          props.updateLayers();
                        }}
                      />
                      <button className="selectContainer" onClick={() => {}}>
                        <TextureSelector
                          layer={layer}
                          changeOptions={(options) => {
                            layer.selection = undefined;
                            layer.options = options;
                            props.updateLayers();
                          }}
                          changeTexture={(selection) => {
                            layer.selection = selection;
                            props.updateLayers();
                          }}
                        />
                      </button>
                      {state.mobile ? (
                        <MoveButton />
                      ) : (
                        <button
                          className="delete"
                          onClick={() => props.deleteLayer(layer)}
                        >
                          <TrashIcon />
                        </button>
                      )}
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
};
