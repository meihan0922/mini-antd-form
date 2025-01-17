- [mini-antd-form](#mini-antd-form)
  - [實現思路](#實現思路)
  - [資料夾結構](#資料夾結構)
  - [具體實現](#具體實現)
    - [先實現簡單的架構](#先實現簡單的架構)
    - [Field 實現訂閱 Store](#field-實現訂閱-store)
    - [Field 實現觸發 react 渲染](#field-實現觸發-react-渲染)
    - [實現 validate](#實現-validate)
    - [適配類組件](#適配類組件)
    - [把 Field 寫成函式組件](#把-field-寫成函式組件)

# mini-antd-form

源碼核心邏輯在 `rc-field-form`。
雖然 antD4 已經過時，但背後的思想在各大框架依然看得到，所以探究下原理。
主要著重在狀態的提取，實現小部分渲染。
ps.只實現部分功能。

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

2. 導出 Form

> src/components/my-form/index.js

```tsx
import useForm from "./useForm";

const Form = _Form;
Form.Field = Field;
Form.useForm = useForm;

export { Field, useForm };
export default Form;
```

3. 處理 Form 組件

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

4. 處理 `FieldContext`

簡單定義一個 `context` 就好

> src/components/my-form/FieldContext.js

```tsx
import React, { createContext } from "react";

const FieldContext = createContext();

export default FieldContext;
```

5. 處理儲存區

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

6. 處理 Field 組件

先使用 class 組件寫，之後會說明為什麼。
主要是從 `context` 跨層級拿儲存庫的內容。
以 `cloneElement` 改變 props 內容，並且 context 以 `props.children` 的方式，可以有效防止重新渲染（可以看 `mini-react 專案` 內有寫 composition 優化）。
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

### Field 實現訂閱 Store

1. 處理 Form 組件

- props

  - children
  - form?
  - onFinish
  - onFinishFailed

> src/components/my-form/Form.js

```tsx
export default function Form(
  { children, form, onFinish, onFinishFailed },
  ref
) {
  form.setCallbacks({
    onFinish,
    onFinishFailed,
  });

  return (
    <form
      onSubmit={(e) => {
        // 阻止預設的提交
        e.preventDefault();
        form.submit();
      }}
    >
      {/* FieldContext 只使用到 跨組件傳遞的部分 */}
      <FieldContext.Provider value={form}> {children}</FieldContext.Provider>
    </form>
  );
}
```

2. FormStore 儲存 Field 元件

> src/components/my-form/useForm.js

```tsx
class FormStore {
  constructor() {
    this.store = {}; // 狀態庫
    this.fieldEntities = []; // 把每個 Field 都訂閱
    this.callbacks = {};
  }

  registerFieldEntities = (entity) => {
    // 儲存整個實例，這也是為什麼要用 class 組件
    this.fieldEntities.push(entity);

    // 回傳銷毀的函式
    return () => {
      this.fieldEntities = this.fieldEntities.filter((item) => item !== entity);
      delete this.store[entity.props.name];
    };
  };

  // 儲存 onFinish, onFinishFailed
  setCallbacks = (cbs) => {
    this.callbacks = {
      ...this.callbacks,
      ...cbs,
    };
  };

  // ...省略

  // 外層可以拿到整個儲存庫
  getForm = () => {
    return {
      getFieldValue: this.getFieldValue,
      getFieldsValue: this.getFieldsValue,
      setFieldsValue: this.setFieldsValue,
      submit: this.submit,
      setCallbacks: this.setCallbacks,
      registerFieldEntities: this.registerFieldEntities,
    };
  };
}
```

3. 處理 Field 組件

在 `componentDidMount`，儲存整個實例，這也是為什麼要用 class 組件

> src/components/my-form/Field.js

```tsx
export default class Field extends Component {
  static contextType = FieldContext;

  componentDidMount() {
    this.unregister = this.context.registerFieldEntities(this);
  }

  componentWillUnmount() {
    this.unregister();
  }

  // ...中間省略

  render() {
    const { children } = this.props;
    const returnChildNode = React.cloneElement(children, this.getControlled());
    return returnChildNode;
  }
}
```

### Field 實現觸發 react 渲染

前面有說，希望局部重新渲染，所以把觸發寫在 `Field`。
類組件中，有 `forceUpdate` 可以使 react 更新

```tsx
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
```

交給 `FormStore`，在 `setFieldsValue` 實現更新。

```tsx
// 定義狀態管理庫
class FormStore {
  constructor() {
    this.store = {}; // 狀態庫
    this.fieldEntities = []; // 把每個 Field 都訂閱
    this.callbacks = {};
  }

  registerFieldEntities = (entity) => {
    // 訂閱後要做更新
    this.fieldEntities.push(entity);

    return () => {
      this.fieldEntities = this.fieldEntities.filter((item) => item !== entity);
      delete this.store[entity.props.name];
    };
  };

  setFieldsValue = (newStore) => {
    this.store = {
      ...this.store,
      ...newStore,
    };
    this.fieldEntities.forEach((i) => {
      Object.keys(newStore).forEach((k) => {
        if (k === i.props.name) {
          // 如果 Field 內有更新，才需要改變
          i.onStoreChange();
        }
      });
    });
    return this.store;
  };
}
```

### 實現 validate

源碼中這裡實現比較複雜，先實現 required 判斷而已。

```tsx
// 定義狀態管理庫
class FormStore {
  constructor() {
    this.store = {}; // 狀態庫
    this.fieldEntities = []; // 把每個 Field 都訂閱
    this.callbacks = {};
  }

  // ... 中間省略
  validate = () => {
    let err = [];
    this.fieldEntities.forEach((i) => {
      if (i.props.rules) {
        const { name, rules } = i.props;
        let rule = rules[0];
        const val = this.getFieldValue(name);
        if (rule && rule.required) {
          if (val === undefined || val === "") {
            err.push({ name: rule.message, value: val });
          }
        }
      }
    });
    return err;
  };

  submit = () => {
    let err = this.validate();
    const { onFinish, onFinishFailed } = this.callbacks;
    if (err.length === 0) {
      onFinish(this.getFieldsValue());
    } else {
      onFinishFailed(err, this.getFieldsValue());
    }
  };
}
```

### 適配類組件

官網中有一段文字：`注意 useForm 是 React Hooks 的实现，只能用于函数组件。如果是在 Class Component 下，你也可以通过 ref 获取数据域`。

意思是說函式組件可以用 `const [form] = Form.useForm();` 來取得 form 儲存區。但 class 組件不行，
他的使用情境是：

```tsx
class MyRCFieldFormClass extends Component {
  formRef = React.createRef();

  // 在綁定好組件後，設定預設值
  componentDidMount() {
    this.formRef.current.setFieldsValue({
      username: "default!",
    });
  }

  onFinish = (val) => {
    console.log(
      "%csrc/pages/MyRCFieldForm.tsx:16 onFinish",
      "color: #26bfa5;",
      val
    );
  };

  onFinishFailed = (val) => {
    console.log(
      "%csrc/pages/MyRCFieldForm.tsx:16 onFinishFailed",
      "color: #26bfa5;",
      val
    );
  };

  render() {
    return (
      <div>
        <h3>MyRCFieldFormClass</h3>
        <Form
          ref={this.formRef}
          onFinish={this.onFinish}
          onFinishFailed={this.onFinishFailed}
        >
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
}
```

把 `formStore` 綁上 `formRef`，但在 export 的地方，不能直接這樣輸出 ref，會爆錯誤。

```tsx
// ❌ 會需要轉發 ref
const Form = _Form;

// ⭕️
const Form = React.forwardRef(_Form);
```

一定必須呼叫 `useForm`，但要區分類組件跟函式組件的用法：

- 函式組件: 傳 `form`，可能使用者會自行調用 `useForm`，再透過 props 傳遞下來。
- 類組件: 傳 `ref`，必須要賦予 `formInstance`。

所以乾脆內部再次調用 `useForm` 傳入 form，如果是函式組件，已經創建過了，就不用再創建 `FormStore`。

> src/components/my-form/Form.js

```tsx
export default function Form(
  { children, form, onFinish, onFinishFailed },
  ref
) {
  const [formInstance] = useForm(form);
  form.setCallbacks({
    onFinish,
    onFinishFailed,
  });

  // 外暴指定的物件: 讓父組件可以使用 ref
  useImperativeHandle(ref, () => {
    return formInstance;
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        formInstance.submit();
      }}
    >
      {/* 只使用到 跨組件傳遞的部分 */}
      <FieldContext.Provider value={formInstance}>
        {children}
      </FieldContext.Provider>
    </form>
  );
}
```

> src/components/my-form/useForm.js

```tsx
// 儲存 form 儲存區塊，只有一個！
export default function useForm(form) {
  const formRef = useRef();
  if (!formRef.current) {
    if (form) {
      formRef.current = form;
    } else {
      const store = new FormStore().getForm();
      formRef.current = store;
    }
  }
  return [formRef.current];
}
```

這樣就可以適配兩種使用方式。

### 把 Field 寫成函式組件

會遇到幾個問題：

1. 前面把 `Field` 寫成類組件，是因為會註冊訂閱，儲存實例。如果是函式組件要另外處理！
2. 調用 react 更新是 `forceUpdate` ，函式組件另外用 `useReducer` 做更新。為什麼不用 `useState`，可以參閱 `mini-react 專案` 內有寫，他有優化，提前比較，不一定會觸發更新！
3. `componentDidMount` 註冊 `Field 實例`，不可以直接轉換成 `useEffect`，延遲執行會導致使用者在外部組件調用 `formStore` 時，還沒有拿到實例。因此要勇 `useLayoutEffect`。

```tsx
export function Field(props) {
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

  // 如果外層使用者使用類組件在 componentDidMount 更新初始值，就會來不及反應給組件，因此用 useLayoutEffect
  useLayoutEffect(() => {
    return registerFieldEntities({ props, onStoreChange: forceUpdate });
  }, []);

  const returnChildNode = React.cloneElement(children, getControlled());

  return returnChildNode;
}
```
