import InterfaceComponent from "./interface.vue";

export default {
  id: "registration-method-template",
  name: "Registration Method with Template",
  icon: "upload_file",
  description: "Select manual or Excel upload and download the official template.",
  component: InterfaceComponent,
  options: [
    {
      field: "template_url",
      name: "Template URL",
      type: "string",
      meta: {
        width: "full",
        interface: "input",
        options: {
          placeholder: "URL template Excel yang dapat diakses applicant",
        },
      },
    },
  ],
  types: ["string"],
};
