import { useRef } from "react";

// 定義狀態管理庫
class FormStore {
  constructor() {
    this.store = {}; // 狀態庫
    this.fieldEntities = []; // 把每個 Field 都訂閱
    this.callbacks = {};
  }

  // 儲存 onFinish, onFinishFailed
  setCallbacks = (cbs) => {
    this.callbacks = {
      ...this.callbacks,
      ...cbs,
    };
  };

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

  getFieldValue = (key) => {
    return this.store[key];
  };

  getFieldsValue = () => {
    return { ...this.store };
  };

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

  // 外層可以拿到整個儲存庫
  getForm = () => {
    return {
      getFieldValue: this.getFieldValue,
      getFieldsValue: this.getFieldsValue,
      setFieldsValue: this.setFieldsValue,
      registerFieldEntities: this.registerFieldEntities,
      submit: this.submit,
      setCallbacks: this.setCallbacks,
    };
  };
}

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
