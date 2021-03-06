import React, {
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacityProps,
  FlatList,
  NativeScrollPoint,
  LayoutRectangle,
  TextStyle,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import {ChipActionType, ChipIcon, ChipIconAction, ChipInfo} from '../../types';
import {Icon} from '../icon';
import {ButtonBaseProps} from '../button';
import ChipItem from './ChipItem';
import {Touchable} from '../touchable';
import {filterSelectList} from '../../utilities';

export interface ChipItemBaseProps
  extends TouchableOpacityProps,
    ButtonBaseProps {
  rounded?: boolean;
  children?: ReactNode;
}

export interface ChipProps extends ChipItemBaseProps {
  actionType?: ChipActionType;
  chips: string[];
  chipContainerStyle?: ((id: string) => ViewStyle) | ViewStyle;
  chipComponent?(info: ChipInfo): string | JSX.Element;
  chipTitleStyle?: ((id: string) => TextStyle) | TextStyle;
  selectedChipContainerStyle?: ((id: string) => ViewStyle) | ViewStyle;
  selectedChipTitleStyle?: ((id: string) => TextStyle) | TextStyle;
  leftIcon?: ChipIcon;
  leftIconAction?: ChipIconAction;
  rightIcon?: ChipIcon;
  rightIconAction?: ChipIconAction;
  horizontal?: boolean;
  horizontalScrollIndicator?: boolean;
  horizontalScrollEnabled?: boolean;
  horizontalScrollButton?: boolean;
  horizontalScrollLeftButton?: JSX.Element;
  horizontalScrollLeftButtonContainerStyle?: ViewStyle;
  horizontalScrollRightButton?: JSX.Element;
  horizontalScrollRightButtonContainerStyle?: ViewStyle;
  selectedId?: string | string[];
  onSelect(id: string, selected: string[]): void;
}

export default function Chip({
  actionType = 'chip',
  containerStyle,
  chips,
  chipContainerStyle,
  chipComponent,
  chipTitleStyle,
  selectedChipContainerStyle,
  selectedChipTitleStyle,
  horizontal,
  horizontalScrollIndicator = false,
  horizontalScrollEnabled = true,
  horizontalScrollButton = true,
  horizontalScrollLeftButton,
  horizontalScrollLeftButtonContainerStyle,
  horizontalScrollRightButton,
  horizontalScrollRightButtonContainerStyle,
  selectedId,
  leftIcon,
  leftIconAction,
  rightIcon,
  rightIconAction,
  onSelect,
  onPress,
  ...props
}: ChipProps) {
  const singleValue = useMemo(() => actionType === 'radio', [actionType]);
  const [chipIds, setChipIds] = useState(chips);
  const [layout, setLayout] = useState<LayoutRectangle>();
  const [size, setSize] = useState<NativeScrollPoint>();
  const [offset, setOffset] = useState<NativeScrollPoint>({x: 0, y: 0});
  const [selected, setSelected] = useState<string[]>(
    filterSelectList(chipIds, selectedId || [], singleValue),
  );
  const refScroll = useRef<FlatList<string>>();
  const initialize = useRef(false);

  const difSize = useMemo(
    () => (layout && size ? size.x - layout.width : undefined),
    [layout],
  );

  const allowScrollLeft = useMemo(() => offset !== undefined && offset.x > 0, [
    offset,
  ]);

  const allowScrollRight = useMemo(
    () => difSize !== undefined && offset.x < difSize,
    [difSize, offset],
  );

  const isSelected = useCallback((id: string) => selected.indexOf(id) >= 0, [
    selected,
  ]);

  const removeChipId = useCallback(
    (id: string) => setChipIds(chipIds.filter(chipId => chipId !== id)),
    [chipIds],
  );

  const getIconAction = useCallback(
    (id: string, iconActionFunction?: ChipIconAction) => {
      if (iconActionFunction) {
        const action = iconActionFunction(id, isSelected(id));

        if (action === 'delete') {
          return () => removeChipId(id);
        } else if (action === 'check') {
          return undefined;
        }

        return action;
      }

      return undefined;
    },
    [isSelected],
  );

  const handleRefList = useCallback((instance: FlatList<string>) => {
    if (instance) {
      refScroll.current = instance;
    }
  }, []);

  const handlePressChipItem = useCallback(
    (id: string, event: GestureResponderEvent) => {
      onPress && onPress(event);

      if (actionType !== 'chip') {
        if (actionType === 'checkbox') {
          const selection = [...selected];

          if (isSelected(id)) {
            selection.splice(selection.indexOf(id), 1);
          } else {
            selection.push(id);
          }

          setSelected(selection);
          onSelect(id, selection);
        } else {
          const selection = [id];

          setSelected([id]);
          onSelect(id, selection);
        }
      } else {
        onSelect(id, selected);
      }
    },
    [actionType, selected, isSelected, onPress, onSelect],
  );

  const handlePressScrollLeftButton = useCallback(
    () =>
      refScroll.current &&
      refScroll.current.scrollToOffset({
        offset: Math.max(0, offset.x - 125),
        animated: true,
      }),
    [refScroll.current, offset],
  );

  const handlePressScrollRightButton = useCallback(
    () =>
      refScroll.current &&
      difSize &&
      refScroll.current.scrollToOffset({
        offset: Math.min(difSize, offset.x + 125),
        animated: true,
      }),
    [refScroll.current, difSize, offset],
  );

  const handleRenderIcon = useCallback(
    (
      id: string,
      iconFunction?: ChipIcon,
      iconActionFunction?: ChipIconAction,
    ) => {
      if (iconFunction) {
        return iconFunction({id, isSelected: isSelected(id)});
      }

      if (iconActionFunction) {
        const action = iconActionFunction(id, isSelected(id));

        if (action === 'delete') {
          return (
            <Icon
              testID="icon-delete"
              style={styles.icon}
              name="times-circle"
            />
          );
        } else if (action === 'check' && isSelected(id)) {
          return (
            <Icon
              style={StyleSheet.flatten([styles.icon, styles.iconCheck])}
              name="check"
            />
          );
        }
      }

      return undefined;
    },
    [isSelected],
  );

  const handleRenderChipItem = useCallback(
    (id: string) => {
      const component =
        chipComponent && chipComponent({id, isSelected: isSelected(id)});
      const title =
        typeof component === 'string'
          ? component
          : component === undefined
          ? id
          : undefined;

      return (
        <ChipItem
          {...props}
          key={id}
          containerStyle={StyleSheet.flatten([
            typeof chipContainerStyle === 'function'
              ? chipContainerStyle(id)
              : chipContainerStyle,
            isSelected(id)
              ? StyleSheet.flatten([
                  styles.selectedChipContainer,
                  typeof selectedChipContainerStyle === 'function'
                    ? selectedChipContainerStyle(id)
                    : selectedChipContainerStyle,
                ])
              : {},
          ])}
          title={title}
          titleStyle={StyleSheet.flatten([
            typeof chipTitleStyle === 'function'
              ? chipTitleStyle(id)
              : chipTitleStyle,
            isSelected(id)
              ? typeof selectedChipTitleStyle === 'function'
                ? selectedChipTitleStyle(id)
                : selectedChipTitleStyle
              : {},
          ])}
          leftIcon={handleRenderIcon(id, leftIcon, leftIconAction)}
          leftIconAction={getIconAction(id, leftIconAction)}
          rightIcon={handleRenderIcon(id, rightIcon, rightIconAction)}
          rightIconAction={getIconAction(id, rightIconAction)}
          onPress={event => handlePressChipItem(id, event)}>
          {component !== undefined &&
            typeof component !== 'string' &&
            component}
        </ChipItem>
      );
    },
    [
      props,
      chipTitleStyle,
      chipContainerStyle,
      selectedChipTitleStyle,
      selectedChipContainerStyle,
      leftIcon,
      leftIconAction,
      rightIcon,
      rightIconAction,
      chipComponent,
      isSelected,
      handleRenderIcon,
      handlePressChipItem,
    ],
  );

  const handleRenderScrollLeftButton = useMemo(
    () =>
      horizontalScrollButton && (
        <Touchable
          testID="button-left"
          disabled={!allowScrollLeft}
          style={StyleSheet.flatten([
            styles.scrollContainer,
            styles.scrollLeftIconContainer,
            horizontalScrollLeftButtonContainerStyle,
            !allowScrollLeft ? styles.scrollContainerDisabled : {},
          ])}
          onPress={handlePressScrollLeftButton}>
          {horizontalScrollLeftButton || <Icon name="chevron-left" />}
        </Touchable>
      ),
    [
      allowScrollLeft,
      horizontalScrollButton,
      horizontalScrollLeftButton,
      horizontalScrollLeftButtonContainerStyle,
      handlePressScrollLeftButton,
    ],
  );

  const handleRenderScrollRightButton = useMemo(() => {
    return (
      horizontalScrollButton && (
        <Touchable
          testID="button-right"
          disabled={!allowScrollRight}
          style={StyleSheet.flatten([
            styles.scrollContainer,
            styles.scrollRightIconContainer,
            horizontalScrollRightButtonContainerStyle,
            !allowScrollRight ? styles.scrollContainerDisabled : {},
          ])}
          onPress={handlePressScrollRightButton}>
          {horizontalScrollRightButton || <Icon name="chevron-right" />}
        </Touchable>
      )
    );
  }, [
    allowScrollRight,
    horizontalScrollButton,
    horizontalScrollRightButton,
    horizontalScrollRightButtonContainerStyle,
    handlePressScrollRightButton,
  ]);

  const handleRenderListChipItem = useMemo(
    () => chipIds.map(id => handleRenderChipItem(id)),
    [chipIds, handleRenderChipItem],
  );

  useEffect(() => {
    setChipIds(chips);
  }, [chips]);

  useEffect(() => {
    if (initialize.current) {
      setSelected(filterSelectList(chipIds, selectedId || [], singleValue));
    } else {
      initialize.current = true;
    }
  }, [singleValue, chipIds, selectedId]);

  return horizontal ? (
    <View style={StyleSheet.flatten([containerStyle, styles.containerNoWrap])}>
      {handleRenderScrollLeftButton}
      <FlatList
        horizontal
        testID="list"
        ref={handleRefList}
        onLayout={event => setLayout(event.nativeEvent.layout)}
        data={chipIds}
        scrollEnabled={horizontalScrollEnabled}
        onContentSizeChange={(w, h) => setSize({x: w, y: h})}
        onScroll={event => setOffset(event.nativeEvent.contentOffset)}
        contentContainerStyle={styles.sectionWrap}
        showsHorizontalScrollIndicator={horizontalScrollIndicator}
        keyExtractor={item => item}
        renderItem={({item}) => handleRenderChipItem(item)}
      />
      {handleRenderScrollRightButton}
    </View>
  ) : (
    <View style={StyleSheet.flatten([containerStyle, styles.containerWrap])}>
      {handleRenderListChipItem}
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  containerNoWrap: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  chipContainer: {
    padding: 7.5,
    marginHorizontal: 5,
    marginVertical: 5,
    backgroundColor: 'lightgray',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTitle: {
    fontWeight: 'normal',
    color: 'black',
  },
  chipTitleContainer: {
    marginHorizontal: 5,
  },
  chipLeftIconContainer: {
    marginRight: 0,
  },
  chipRightIconContainer: {
    marginLeft: 0,
  },
  scrollContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: 'whitesmoke',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainerDisabled: {
    opacity: 0.2,
  },
  scrollLeftIconContainer: {
    marginRight: 5,
  },
  scrollRightIconContainer: {
    marginLeft: 5,
  },
  selectedChipContainer: {
    backgroundColor: 'dodgerblue',
  },
  sectionWrap: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    color: 'dimgray',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  iconCheck: {
    fontSize: 16,
  },
});
