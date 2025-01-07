import React, { useImperativeHandle } from "react";
import FieldContext from "./FieldContext";
import useForm from "./useForm";

export default function Form(
  { children, form, onFinish, onFinishFailed },
  ref
) {
  const [formInstance] = useForm(form);
  formInstance.setCallbacks({
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
