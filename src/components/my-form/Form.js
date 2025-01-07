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
