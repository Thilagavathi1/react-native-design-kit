import {fireEvent, render} from '@testing-library/react-native';
import React from 'react';
import {ObjectPartial} from '../../types';
import Slider, {SliderProps} from './Slider';

const defaultProps: SliderProps = {
  onChangeValue: jest.fn(),
};

function runTest(name: string, props?: ObjectPartial<SliderProps>) {
  test(name, async () => {
    const {getByTestId} = render(<Slider {...defaultProps} {...props} />);
    const trackContainer = getByTestId('track-container');

    fireEvent(trackContainer, 'responderStart');
    fireEvent(trackContainer, 'responderMove');
    fireEvent(trackContainer, 'layout', {nativeEvent: {layout: {width: 250}}});

    const thumbContainer = getByTestId('thumb-container');

    fireEvent(thumbContainer, 'layout', {
      nativeEvent: {layout: {width: 10, height: 20}},
    });

    fireEvent(trackContainer, 'startShouldSetResponder');
    fireEvent(trackContainer, 'responderStart', {
      nativeEvent: {pageX: 50, locationX: 50},
    });
    fireEvent(trackContainer, 'responderMove', {
      nativeEvent: {pageX: 100, locationX: 100},
    });

    if (props?.button) {
      const buttonStart = getByTestId('button-start');
      const buttonEnd = getByTestId('button-end');

      fireEvent.press(buttonStart);
      fireEvent.press(buttonEnd);
    }
  });
}

describe('Slider', () => {
  runTest('default');
  runTest('button', {button: true});
  runTest('button buttonValue', {button: true, buttonValue: 20});
  runTest('indicator', {indicator: true});
  runTest('initialValue', {initialValue: 50});
});
