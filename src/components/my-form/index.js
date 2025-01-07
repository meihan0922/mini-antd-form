import _Form from "./Form";
import Field from "./Field";
import useForm from "./useForm";
import React from "react";

// ! 這樣 Form 就可以接受 props 是 ref 了
const Form = React.forwardRef(_Form);
Form.Field = Field;
Form.useForm = useForm;

export { Field, useForm };
export default Form;
