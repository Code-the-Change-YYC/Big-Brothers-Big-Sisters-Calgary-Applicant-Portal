<template>
  <div>
    <v-btn
      target="_blank"
      :href="task.fileUpload"
      icon
      rel="noreferrer noopener"
      download="Offence Declaration.pdf"
      color="accent"
    >
      <v-icon>mdi-download</v-icon>
    </v-btn>
    <v-btn v-if="!isAdminView" color="accent darken-1" text @click="deleteFile"> Delete </v-btn>
  </div>
</template>

<script>
import firebase from "firebase";
import "firebase/firestore";

export default {
  name: "download",
  props: {
    task: Object,
    applicantID: String,
    isAdminView: {
      default: false,
      type: Boolean
    }
  },
  methods: {
    /**
     * Deletes the download URL for the file associated with the task and user
     * Deletes the file from Firebase Storage
     */
    async deleteFile() {
      try {
        await firebase
          .storage()
          .ref(`${this.applicantID}/${this.task.name}`)
          .delete();

        await firebase
          .firestore()
          .collection("users")
          .doc(this.applicantID)
          .update({
            fileUpload: firebase.firestore.FieldValue.delete(),
          });
        this.task.fileUpload = null;
        this.$emit("deleted", this.task);
      } catch (error) {
        console.log(error);
        this.$emit("delete-error", error.message);
      }
    },
  },
};
</script>