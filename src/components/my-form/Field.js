import React, {
  Component,
  useContext,
  useEffect,
  useLayoutEffect,
  useReducer,
} from "react";
import FieldContext from "./FieldContext";

export function FieldF(props) {
  const { getFieldValue, setFieldsValue, registerFieldEntities } =
    useContext(FieldContext);
  const { children, name } = props;
  // 強制讓組件更新
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const getControlled = () => {
    return {
      value: getFieldValue(name), // 用三方管理庫，拿狀態
      onChange: (e) => {
        const newVal = e.target.value;
        setFieldsValue({
          [name]: newVal,
        });
      },
    };
  };

  const returnChildNode = React.cloneElement(children, getControlled());

  // 如果外層使用者使用類組件在 componentDidMount 更新初始值，就會來不及反應給組件，因此用 useLayoutEffect
  useLayoutEffect(() => {
    return registerFieldEntities({ props, onStoreChange: forceUpdate });
  }, []);

  return returnChildNode;
}

export default class Field extends Component {
  static contextType = FieldContext;

  componentDidMount() {
    this.unregister = this.context.registerFieldEntities(this);
  }

  componentWillUnmount() {
    this.unregister();
  }

  onStoreChange = () => {
    this.forceUpdate();
  };

  getControlled = () => {
    const { getFieldValue, setFieldsValue } = this.context;
    const { name } = this.props;

    return {
      value: getFieldValue(name),
      onChange: (e) => {
        const newVal = e.target.value;
        setFieldsValue({
          [name]: newVal,
        });
      },
    };
  };

  render() {
    const { children } = this.props;
    const returnChildNode = React.cloneElement(children, this.getControlled());
    return returnChildNode;
  }
}
