import React, {useState, useEffect} from 'react';
import {
  View,
  TextStyle,
  ViewStyle,
  TextInputProps,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  Platform,
  TouchableWithoutFeedback,
  LayoutRectangle,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {Layout} from '../layout';

export type InputIcon = ((status: InputStatus) => JSX.Element) | JSX.Element;
export type InputIconAction = 'delete' | 'toggle-visibility' | (() => void);
export type InputFillStatus = 'empty' | 'filled';
export type InputVisibilityStatus = 'visibile' | 'hidden';
export type InputStatus = 'normal' | InputFillStatus | InputVisibilityStatus;
export type InputError = string | InputValidation | InputValidation[];

export interface InputValidation {
  regex?: RegExp;
  validation?(text: string): boolean;
  error: string;
}

export interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  label?: string;
  labelStyle?: TextStyle;
  labelContainerStyle?: ViewStyle;
  labelPosition?: 'container' | 'box' | 'border';
  labelBoxStandBySize?: number;
  labelBoxStandByOffset?: number;
  labelBoxActiveSize?: number;
  labelBoxActiveOffset?: number;
  inputBoxActiveOffset?: number;
  inputContainerStyle?: ViewStyle;
  inputRef?(instance: TextInput): void;
  leftIcon?: InputIcon;
  leftIconAction?: InputIconAction;
  leftIconContainerStyle?: ViewStyle;
  rightIcon?: InputIcon;
  rightIconAction?: InputIconAction;
  rightIconContainerStyle?: ViewStyle;
  focusStyle?: TextStyle;
  focusLabelStyle?: TextStyle;
  focusLabelContainerStyle?: ViewStyle;
  focusContainerStyle?: ViewStyle;
  focusInputContainerStyle?: ViewStyle;
  focusLeftIconContainerStyle?: ViewStyle;
  focusRightIconContainerStyle?: ViewStyle;
  error?: InputError;
  errorPosition?: 'relative' | 'absolute';
  errorStyle?: TextStyle;
  errorLabelStyle?: TextStyle;
  errorLabelContainerStyle?: ViewStyle;
  errorContainerStyle?: ViewStyle;
  errorInputContainerStyle?: ViewStyle;
  errorLeftIconContainerStyle?: ViewStyle;
  errorRightIconContainerStyle?: ViewStyle;
  clearErrorOnFocus?: boolean;
}

export default function Input({
  containerStyle,
  label,
  labelStyle,
  labelContainerStyle,
  labelPosition = 'container',
  inputContainerStyle,
  inputRef,
  leftIcon,
  leftIconAction,
  leftIconContainerStyle,
  rightIcon,
  rightIconAction,
  rightIconContainerStyle,
  focusStyle,
  focusLabelStyle,
  focusContainerStyle,
  focusLabelContainerStyle,
  focusInputContainerStyle,
  focusLeftIconContainerStyle,
  focusRightIconContainerStyle,
  error,
  errorPosition = 'relative',
  errorStyle,
  errorLabelStyle,
  errorLabelContainerStyle,
  errorContainerStyle,
  errorInputContainerStyle,
  errorLeftIconContainerStyle,
  errorRightIconContainerStyle,
  clearErrorOnFocus = false,
  labelBoxStandBySize = 15,
  labelBoxStandByOffset = 14,
  labelBoxActiveSize = 12,
  labelBoxActiveOffset = 1,
  inputBoxActiveOffset = 6,
  style,
  placeholder,
  multiline,
  secureTextEntry,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [visibility, setVisibility] = useState(false);
  const [errorMessage, setErrorMessage] = useState(getErrorMessage(undefined));
  const [focus, setFocus] = useState(false);
  const [inputValue, setInputValue] = useState(
    props.value !== undefined ? props.value : props.defaultValue,
  );
  const [fillStatus, setFillStatus] = useState<InputFillStatus>(
    inputValue !== undefined && inputValue.length > 0 ? 'filled' : 'empty',
  );
  const [layout, setLayout] = useState<Layout>();
  const [layoutBorder, setLayoutBorder] = useState<LayoutRectangle>();
  const [ref, setRef] = useState<TextInput>();
  const [refBorder, setRefBorder] = useState<View>();
  const [refContainer, setRefContainer] = useState<View>();
  const themeBorderActive = inputValue !== undefined && inputValue !== '';
  const animation = useState(new Animated.Value(themeBorderActive ? 1 : 0))[0];
  const inputLeftIcon = getIcon(leftIcon, leftIconAction);
  const inputRightIcon = getIcon(rightIcon, rightIconAction);

  useEffect(() => {
    setVisibility(!secureTextEntry);
  }, [secureTextEntry]);

  useEffect(() => {
    setErrorMessage(getErrorMessage(inputValue));
  }, [error]);

  useEffect(() => {
    if (
      inputValue !== undefined &&
      inputValue.length > 0 &&
      fillStatus === 'empty'
    ) {
      setFillStatus('filled');
    } else if (
      (inputValue === undefined || inputValue.length === 0) &&
      fillStatus === 'filled'
    ) {
      setFillStatus('empty');
    }

    Animated.spring(animation, {
      toValue: inputValue !== undefined && inputValue !== '' ? 1 : 0,
      bounciness: 0,
    }).start();
  }, [inputValue]);

  useEffect(() => {
    updateLayout();
  }, [
    containerStyle,
    focusContainerStyle,
    errorContainerStyle,
    inputContainerStyle,
    focusInputContainerStyle,
    errorInputContainerStyle,
  ]);

  useEffect(() => {
    updateLayoutBorder();
  }, [
    label,
    labelPosition,
    labelContainerStyle,
    focusLabelContainerStyle,
    errorLabelContainerStyle,
  ]);

  function getErrorMessage(text?: string) {
    if (error !== undefined) {
      if (typeof error === 'string') {
        return error;
      }

      if (text !== undefined) {
        if (Array.isArray(error)) {
          for (let index = 0; index < error.length; index++) {
            const result = getInputValidationError(error[index], text);

            if (result !== undefined) {
              return result;
            }
          }
        } else {
          return getInputValidationError(error, text);
        }
      }
    }

    return undefined;
  }

  function getInputValidationError(
    inputValidation: InputValidation,
    text: string,
  ) {
    const regex = inputValidation.regex;
    const validation = inputValidation.validation;

    if (!regex?.test(text) || (validation && validation(text))) {
      return inputValidation.error;
    }

    return undefined;
  }

  function updateLayout() {
    errorPosition === 'absolute' &&
      refContainer?.measure((x, y, width, height, pageX, pageY) => {
        setLayout({
          x: x,
          y: y,
          width: width,
          height: height,
          pageX: pageX,
          pageY: pageY,
        });
      });
  }

  function updateLayoutBorder() {
    labelPosition === 'border' &&
      refBorder?.measure((x, y, width, height) => {
        setLayoutBorder({
          x: x,
          y: y,
          width: width,
          height: height,
        });
      });
  }

  function getIcon(inputIcon?: InputIcon, inputIconAction?: InputIconAction) {
    if (inputIconAction !== undefined) {
      if (inputIconAction === 'delete') {
        const iconDelete =
          typeof inputIcon === 'function' ? inputIcon(fillStatus) : inputIcon;

        if (iconDelete !== undefined) {
          return iconDelete;
        }

        return fillStatus === 'filled' ? (
          <Icon style={styles.icon} name="times-circle" />
        ) : (
          undefined
        );
      } else if (inputIconAction === 'toggle-visibility') {
        const iconVisibility =
          typeof inputIcon === 'function'
            ? inputIcon(visibility ? 'visibile' : 'hidden')
            : inputIcon;

        if (iconVisibility !== undefined) {
          return iconVisibility;
        }

        return (
          <Icon style={styles.icon} name={visibility ? 'eye' : 'eye-slash'} />
        );
      }
    }

    return typeof inputIcon === 'function' ? inputIcon('normal') : inputIcon;
  }

  function getIconAction(
    inputIconAction?: InputIconAction,
  ): (() => void) | undefined {
    if (inputIconAction !== undefined) {
      if (typeof inputIconAction === 'string') {
        if (inputIconAction === 'delete') {
          if (fillStatus === 'filled') {
            return () => {
              ref?.clear();
              onChangeText && onChangeText('');
              typeof error === 'object' && setErrorMessage(getErrorMessage(''));
              setFillStatus('empty');
            };
          }
        } else if (inputIconAction === 'toggle-visibility') {
          return () => setVisibility(!visibility);
        }
      } else {
        return () => inputIconAction();
      }
    }

    return undefined;
  }

  return (
    <>
      <View
        ref={instance => instance && setRefContainer(instance)}
        onLayout={() => layout === undefined && updateLayout()}
        style={[
          styles.container,
          containerStyle,
          focus && focusContainerStyle,
        ]}>
        {label !== undefined && labelPosition === 'container' ? (
          <View
            style={StyleSheet.flatten([
              styles.labelContainerThemeContainer,
              labelContainerStyle,
              focus && focusLabelContainerStyle,
              errorMessage !== undefined && errorLabelContainerStyle,
            ])}>
            <Text
              style={StyleSheet.flatten([
                styles.label,
                styles.labelThemeContainer,
                labelStyle,
                focus && focusLabelStyle,
                errorMessage !== undefined && errorLabelStyle,
              ])}>
              {label}
            </Text>
          </View>
        ) : (
          <></>
        )}
        <View
          style={[
            styles.inputContainer,
            inputContainerStyle,
            focus && focusInputContainerStyle,
            errorMessage !== undefined &&
              StyleSheet.flatten([
                styles.errorInputContainer,
                errorInputContainerStyle,
              ]),
          ]}>
          {inputLeftIcon && (
            <View
              style={[
                styles.iconContainer,
                styles.iconLeftContainer,
                leftIconContainerStyle,
                focus && focusLeftIconContainerStyle,
                errorMessage !== undefined && errorLeftIconContainerStyle,
              ]}>
              <TouchableWithoutFeedback onPress={getIconAction(leftIconAction)}>
                {inputLeftIcon}
              </TouchableWithoutFeedback>
            </View>
          )}
          <View style={styles.sectionInputReverse}>
            {inputRightIcon && (
              <View
                style={[
                  styles.iconContainer,
                  styles.iconRightContainer,
                  rightIconContainerStyle,
                  focus && focusRightIconContainerStyle,
                  errorMessage !== undefined && errorRightIconContainerStyle,
                ]}>
                <TouchableWithoutFeedback
                  onPress={getIconAction(rightIconAction)}>
                  {inputRightIcon}
                </TouchableWithoutFeedback>
              </View>
            )}
            <View style={styles.sectionInputBox}>
              {labelPosition === 'box' ? (
                <Animated.View
                  style={StyleSheet.flatten([
                    styles.sectionLabelThemeBox,
                    focus && focusLabelContainerStyle,
                    errorMessage !== undefined && errorLabelContainerStyle,
                    {
                      top: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          labelBoxStandByOffset,
                          labelBoxActiveOffset,
                        ],
                      }),
                    },
                  ])}>
                  <Animated.Text
                    style={StyleSheet.flatten([
                      styles.label,
                      styles.labelThemeBox,
                      labelStyle,
                      focus && focusLabelStyle,
                      errorMessage !== undefined && errorLabelStyle,
                      {
                        fontSize: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            labelBoxStandBySize,
                            labelBoxActiveSize,
                          ],
                        }),
                      },
                      props.placeholderTextColor !== undefined
                        ? {
                            color: props.placeholderTextColor,
                          }
                        : {},
                    ])}>
                    {label !== undefined ? label : placeholder}
                  </Animated.Text>
                </Animated.View>
              ) : (
                <></>
              )}
              <View
                style={StyleSheet.flatten([
                  {height: '100%', width: '100%'},
                  labelPosition === 'box' &&
                    themeBorderActive && {paddingTop: inputBoxActiveOffset},
                ])}>
                <TextInput
                  {...props}
                  ref={instance => {
                    if (instance && ref !== instance) {
                      inputRef && inputRef(instance);
                      setRef(instance);
                    }
                  }}
                  multiline={multiline}
                  secureTextEntry={!visibility}
                  placeholder={
                    labelPosition === 'box' ? undefined : placeholder
                  }
                  style={StyleSheet.flatten([
                    styles.inputBox,
                    multiline && styles.inputBoxMultiline,
                    style,
                    focus && focusStyle,
                  ])}
                  onChangeText={text => {
                    onChangeText && onChangeText(text);
                    setInputValue(text);
                  }}
                  onFocus={event => {
                    onFocus && onFocus(event);
                    clearErrorOnFocus && setErrorMessage(undefined);
                    setFocus(true);
                  }}
                  onBlur={event => {
                    onBlur && onBlur(event);
                    inputValue !== undefined &&
                      setErrorMessage(getErrorMessage(inputValue));
                    setFocus(false);
                  }}
                />
              </View>
              {label !== undefined && labelPosition === 'border' ? (
                <View
                  ref={instance => instance && setRefBorder(instance)}
                  onLayout={() =>
                    layoutBorder === undefined && updateLayoutBorder()
                  }
                  style={[
                    styles.labelContainerThemeBorder,
                    labelContainerStyle,
                    focus && focusLabelContainerStyle,
                    errorMessage !== undefined &&
                      StyleSheet.flatten([
                        styles.errorLabelContainerThemeBorder,
                        errorLabelContainerStyle,
                      ]),
                    styles.sectionLabelThemeBorder,
                    !layoutBorder &&
                      styles.labelContainerThemeBorderTransparent,
                    {
                      top: -1 + (layoutBorder ? -layoutBorder.height / 2 : 0),
                    },
                  ]}>
                  <Text
                    style={StyleSheet.flatten([
                      styles.label,
                      styles.labelThemeBorder,
                      labelStyle,
                      focus && focusLabelStyle,
                      errorMessage !== undefined && errorLabelStyle,
                    ])}>
                    {label}
                  </Text>
                </View>
              ) : (
                <></>
              )}
            </View>
          </View>
        </View>
        {errorMessage !== undefined && errorPosition === 'relative' && (
          <View
            style={StyleSheet.flatten([
              styles.errorContainer,
              errorContainerStyle,
            ])}>
            <Text style={StyleSheet.flatten([styles.error, errorStyle])}>
              {errorMessage}
            </Text>
          </View>
        )}
      </View>
      {errorMessage !== undefined &&
        errorPosition === 'absolute' &&
        layout !== undefined && (
          <View
            style={StyleSheet.flatten([
              styles.errorContainer,
              errorContainerStyle,
              {
                position: 'absolute',
                width: layout.width,
                left: layout.pageX,
                top: layout.pageY + layout.height,
              },
            ])}>
            <Text style={StyleSheet.flatten([styles.error, errorStyle])}>
              {errorMessage}
            </Text>
          </View>
        )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputBox: {
    flex: 1,
    width: '100%',
    fontSize: 15,
    textAlignVertical: 'center',
  },
  inputBoxMultiline: {
    textAlignVertical: 'top',
  },
  inputContainer: {
    flexDirection: 'row',
    height: 48,
    width: '100%',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: 'lightgray',
    backgroundColor: 'whitesmoke',
  },
  labelContainerThemeContainer: {
    marginBottom: 5,
  },
  labelContainerThemeBorder: {
    paddingHorizontal: 2,
    borderWidth: 1,
    borderRadius: 2,
    borderColor: 'lightgray',
    backgroundColor: 'whitesmoke',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainerThemeBorderTransparent: {
    opacity: 0,
  },
  iconContainer: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeftContainer: {
    marginRight: 6,
  },
  iconRightContainer: {
    marginLeft: 6,
  },
  errorInputContainer: {
    borderColor: 'red',
  },
  errorLabelContainerThemeBorder: {
    borderColor: 'red',
  },
  errorContainer: {
    marginTop: 5,
  },
  sectionInputReverse: {
    flex: 1,
    height: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  sectionInputBox: {
    flex: 1,
    height: '100%',
  },
  sectionLabelThemeBorder: {
    position: 'absolute',
  },
  sectionLabelThemeBox: {
    position: 'absolute',
  },
  label: {
    fontSize: 16,
  },
  labelThemeContainer: {
    color: 'dimgray',
    fontWeight: 'bold',
  },
  labelThemeBorder: {
    fontWeight: '600',
    color: 'dimgray',
  },
  labelThemeBox: {
    marginLeft: Platform.OS === 'android' ? 5 : 0,
    color: 'darkgray',
  },
  icon: {
    fontSize: 20,
    color: 'darkgray',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  error: {
    color: 'red',
  },
});
