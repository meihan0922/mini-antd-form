import { useRef } from "react";

// 定義狀態管理庫
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

// 儲存 form 儲存區塊，只有一個！
export default function useForm() {
  const formRef = useRef();
  if (!formRef.current) {
    const store = new FormStore().getForm();
    formRef.current = store;
  }
  return [formRef.current];
}
