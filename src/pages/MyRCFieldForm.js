// import Form, { Field } from "rc-field-form";
import Form, { Field } from "../components/my-form";
import React, { Component, useEffect } from "react";
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
    // form.setFieldsValue({ username: 'default!' });
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
        <h3>MyRCFieldForm</h3>
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
