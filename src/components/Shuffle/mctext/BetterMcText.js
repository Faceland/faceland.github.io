import { compact, forEach, split } from 'lodash';
import { createElement } from 'react';
import { DEFAULT_STYLES } from './constants';
import { buildElement, clearElementProps, setElementProps } from './utils';

export const BetterMcText = (props) => {
  const { line, className } = props;
  const splitText = compact(split(line, '|'));
  let elements = [];
  let elementProps = {
    styles: DEFAULT_STYLES,
    content: '',
    className: className,
  };

  forEach(splitText, (text) => {
    elementProps = setElementProps({ elementProps, text });
    if (elementProps.content) {
      elements.push(buildElement({ elementProps }));
      elementProps = clearElementProps({ className });
    }
  });

  elements.push(createElement('br'));
  return elements;
};
