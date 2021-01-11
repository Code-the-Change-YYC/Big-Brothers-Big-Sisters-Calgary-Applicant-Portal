<template>
  <div>
    <v-file-input
      color="accent"
      label="Upload PDF"
      accept="*/*"
      v-model="fileData"
    >
    </v-file-input>
    <v-btn color="accent darken-1" text @click="resetFile"> Cancel </v-btn>
    <v-btn color="accent darken-1" text @click="saveFile"> Save </v-btn>
  </div>
</template>

<script>
import firebase from "firebase";

export default {
  name: "upload",
  data() {
    return {
      fileData: null,
      downloadUrl: null,
    };
  },
  props: {
    task: Object,
  },
  methods: {
    async saveFile() {
      if (this.fileData == null) {
        this.$emit("upload-error", "Must select a PDF to upload.");
        return;
      }
      try {
        let snapshot = await firebase
          .storage()
          .ref(this.$route.params.applicantID + "/" + `${this.task.name}`)
          .put(this.fileData);
        this.task.fileUpload = await snapshot.ref.getDownloadURL();
        this.$emit("uploaded", this.task);
      } catch (error) {
        this.$emit("upload-error", error.message);
      }
    },
    resetFile() {
      this.fileData = null;
    },
  },
};
</script>
