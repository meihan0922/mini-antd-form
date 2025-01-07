# mini-antd-form

源碼核心邏輯在 `rc-field-form`。
雖然 antD3 和 antD4 已經過時，但背後的思想在各大框架依然看得到，所以探究下原理。
只實現部分功能。

## 實現思路

1. 用戶可以用 class 組件或是函式組件來操作 `form 表單`
   - ❓ 官網中有一段文字：`注意 useForm 是 React Hooks 的实现，只能用于函数组件。如果是在 Class Component 下，你也可以通过 ref 获取数据域`。用 hooks 也就是函式組件組件來寫 `form 表單`，要如何處理 ref？ 函式組件沒有實例。
2. `input` 或是單元區塊要轉為受控組件。
   - 使用 `context.Provider` 綁在 `Form` 層，就可以跨組件傳遞，。
   - ❓ 但又不想要每次改動時，整個 `form` 都重新渲染。要怎麼做呢？
     - 把狀態提升存到第三方庫（`context`），透過 `Field` ， 訂閱狀態，啟動重新渲染 `Field` 的內容。
       - 所以可能是 `useState` 或是 `useReducer` 或是 `forceUpdate` 綁在 `Field` 上面
   - ❓ 做出一個共有的儲存區，存所有的狀態和 `Field` 訂閱還有 `onFinish`、`onFinishFailed` 等等，但不會觸發渲染本身

```tsx
<div>
  <h3>MyRCFieldForm</h3>
  <Form ref form={form} onFinish={onFinish} onFinishFailed={onFinishFailed}>
    <Field name="username" rules={[nameRules]}>
      <Input placeholder="請輸入姓名" />
    </Field>
    <Field name="password" rules={[passwordRules]}>
      <Input placeholder="請輸入密碼" />
    </Field>
    <button>submit</button>
  </Form>
</div>
```

## 資料夾結構

- `Form`: 做出 `Context.Provider` 提供整個儲存區的內容，包含 `getFieldValue`, `setFieldsValue`, `registerFieldEntities`，把 `onFinish`, `onFinishFailed` 存入儲存區、要另外處理 `props.ref`。
- `Field`: 和 `react` 連結，觸發渲染，訂閱儲存區、讓子組件變成受控組件，（把 `value`、`onChange` 插入 props 傳下去）
- `useForm`: 讓外部可以拿到暫存區，並且這個暫存區不能因為重新渲染而更動。
- `FieldContext`: 觸發渲染的 `context` 本身。

## 具體實現

### 先實現簡單的架構

1. 定義使用情境

> src/pages/MyRCFieldForm.js

```tsx
// import Form, { Field } from "rc-field-form";
import Form, { Field } from "../components/my-form";
import React, { useEffect } from "react";
import Input from "../components/Input";

const nameRules = {
  required: true,
  message: "請輸入姓名",
};
const passwordRules = {
  required: true,
  message: "請輸入密碼",
};

export default function MyRCFieldForm(props) {
  // Form 上面會有 useForm 拿到 form 暫存區
  // 當然使用上他不是必填，除非是要使用他的方法
  const [form] = Form.useForm();
  useEffect(() => {
    // 像是這樣
    form.setFieldsValue({ username: "default!" });
  }, []);

  const onFinish = (val) => {
    console.log(
      "%csrc/pages/MyRCFieldForm.tsx:16 onFinish",
      "color: #26bfa5;",
      val
    );
  };
  const onFinishFailed = (val) => {
    console.log(
      "%csrc/pages/MyRCFieldForm.tsx:16 onFinishFailed",
      "color: #26bfa5;",
      val
    );
  };

  return (
    <div>
      <h3>MyRCFieldForm</h3>
      <Form form={form} onFinish={onFinish} onFinishFailed={onFinishFailed}>
        <Field name="username" rules={[nameRules]}>
          <Input placeholder="請輸入姓名" />
        </Field>
        <Field name="password" rules={[passwordRules]}>
          <Input placeholder="請輸入密碼" />
        </Field>
        <button>submit</button>
      </Form>
    </div>
  );
}
```

2. 處理 Form 組件

- props

  - children
  - form?
  - onFinish
  - onFinishFailed

> src/components/my-form/Form.js

```tsx
import React from "react";
import FieldContext from "./FieldContext";
import useForm from "./useForm";

export default function Form(
  { children, form, onFinish, onFinishFailed },
  ref
) {
  return (
    <form
      onSubmit={(e) => {
        // 阻止預設的提交
        e.preventDefault();
      }}
    >
      {/* FieldContext 只使用到 跨組件傳遞的部分 */}
      <FieldContext.Provider value={form}> {children}</FieldContext.Provider>
    </form>
  );
}
```

3. 處理 `FieldContext`

簡單定義一個 `context` 就好

> src/components/my-form/FieldContext.js

```tsx
import React, { createContext } from "react";

const FieldContext = createContext();

export default FieldContext;
```

4. 處理儲存區

使用 `useRef` 讓 `store` 是唯一的指向，不會因為重新渲染而轉換。

> src/components/my-form/useForm.js

```tsx
export default function useForm() {
  const formRef = useRef();
  if (!formRef.current) {
    const store = new FormStore().getForm();
    formRef.current = store;
  }
  return [formRef.current];
}

class FormStore {
  constructor() {
    this.store = {}; // 狀態庫
    this.callbacks = {};
  }

  // 儲存 onFinish, onFinishFailed
  setCallbacks = (cbs) => {
    this.callbacks = {
      ...this.callbacks,
      ...cbs,
    };
  };

  setFieldsValue = (newStore) => {
    this.store = {
      ...this.store,
      ...newStore,
    };
    // !TODO: 待觸發 react 更新渲染
    return this.store;
  };

  getFieldValue = (key) => {
    return this.store[key];
  };

  getFieldsValue = () => {
    return { ...this.store };
  };

  submit = () => {
    const { onFinish, onFinishFailed } = this.callbacks;
    // !TODO: 待寫檢查錯誤
    onFinish(this.getFieldsValue());
  };

  // 外層可以拿到整個儲存庫
  getForm = () => {
    return {
      getFieldValue: this.getFieldValue,
      getFieldsValue: this.getFieldsValue,
      setFieldsValue: this.setFieldsValue,
      submit: this.submit,
      setCallbacks: this.setCallbacks,
    };
  };
}
```

5. 處理 Field 組件

先使用 class 組件寫，之後會說明為什麼。
主要是從 `context` 跨層級拿儲存庫的內容。
以 `cloneElement` 改變 props 內容，並且 context 以 `props.children` 的方式，可以有效防止重新渲染（可以看 mini-react 專案內有寫 composition 優化）。
子節點目前變成受控組件了。

> src/components/my-form/Field.js

```tsx
export default class Field extends Component {
  static contextType = FieldContext;

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
```

簡單寫 input 組件

> src/components/Input.js

```tsx
import React from "react";
import { Input } from "antd";

const CustomizeInput: React.FC = ({ value = "", ...otherProps }) => {
  return (
    <div>
      <Input style={{ outline: "none" }} value={value} {...otherProps} />
    </div>
  );
};

export default CustomizeInput;
```
