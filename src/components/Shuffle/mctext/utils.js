import { every, get, isEmpty, trim } from 'lodash';
import { createElement } from 'react';
import {
  CHINESE,
  COLORS,
  DEFAULT_STYLES,
  FONT_STYLES,
  TEXT_DECORATIONS,
} from './constants';

const handleChineseCharacters = (text, elementProps) => {
  const newElementProps = elementProps;
  const character = get(CHINESE, trim(text));
  if (character) {
    newElementProps.styles.color = character.color;
    newElementProps.content = character.content;
    if (character !== text) {
      newElementProps.content += ' ';
    }
  }
  return newElementProps;
};

const mapStyles = (text) => {
  const newStyles = {
    color: get(COLORS, text),
    fontStyle: get(FONT_STYLES, text),
    textDecoration: get(TEXT_DECORATIONS, text),
  };
  const hasStyles = !every(newStyles, (style) => isEmpty(style));
  return hasStyles ? newStyles : null;
};

export const buildElement = ({ elementProps, className }) => {
  const element = createElement(
    'span',
    {
      className: className,
      style: elementProps.styles,
    },
    `${elementProps.content}`,
  );
  return element;
};

export const clearElementProps = () => {
  return { styles: DEFAULT_STYLES, content: '' };
};

export const setElementProps = ({ elementProps, text }) => {
  let newElementProps = elementProps;
  const newStyles = mapStyles(text);
  if (newStyles) {
    newElementProps.styles = {
      color: newStyles.color || elementProps.styles.color,
      fontStyle: newStyles.fontStyle || elementProps.styles.fontStyle,
      textDecoration:
        newStyles.textDecoration || elementProps.styles.textDecoration,
    };
  } else {
    newElementProps.content = text;
  }
  newElementProps = handleChineseCharacters(text, newElementProps);
  return newElementProps;
};
