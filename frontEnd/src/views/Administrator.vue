<template>
  <v-container fluid style="margin: 0 auto 0 auto; padding: 0px; width: 90%">
  <bbbs-header @newNotif="displayNotification" fluid style="margin: 0 auto 0 auto; padding: 0px; width: 90%"></bbbs-header>
  <carousel></carousel>
  <v-card class="mx-auto">
    <v-spacer></v-spacer>
    <v-card-title>
      Applicants
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        color="accent"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="users"
      :search="search"
      item-key="id"
      hide-default-footer
      :items-per-page="10"
      :page.sync="page"
      @click:row="goToApplicantView"
      loading
      loading-text="Loading... Please wait"
    >
      <template v-slot:item.name="{item}">
        <td>{{item.name}}</td>
      </template>
      <template v-slot:item.status="{ item }">
        <v-chip 
          :color="getColor(item.status)"
          dark
          text-color="white"
        >
          {{ item.status }}
        </v-chip>
      </template>
      <template v-slot:item.waitingApproval="{ item }">
        <v-icon :color="item.waitingApproval === 'mdi-check-circle' ? 'green': 'inprogress'">
          {{item.waitingApproval}}
        </v-icon>
      </template>
      <!-- <template v-slot:item.actions="{ item }">
      <v-icon
        medium
        @click="deleteUser(item)"
      >
        mdi-delete
      </v-icon>
    </template> -->
    </v-data-table>
    <v-divider></v-divider>
    <v-pagination
      v-model="page"
      class="my-3"
      color="accent"
      :length="Math.ceil(users.length/10)"
      circle
    ></v-pagination>
    <bbbs-footer></bbbs-footer>
  </v-card>
  <v-snackbar v-model="snackbar" color="accent">
      {{ notif }}
      <template v-slot:action="{ attrs }">
        <v-btn
          align="right"
          icon
          v-bind="attrs"
          @click="snackbar = false"
        >
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
  import Header from "../components/Header.vue";
  import Footer from "../components/Footer.vue";
  import Carousel from '../components/Carousel.vue';
  import firebase from 'firebase';

  export default {
    name: 'Administrator',
    components: {
      'bbbs-header' : Header,
      'bbbs-footer' : Footer,
      'carousel' : Carousel
    },
    data () {
      return {
        width: window.innerWidth,
        height: window.innerHeight * 0.3, 
        search: '',
        headers: [
          {
            text: 'Name',
            align: 'start',
            selectable: true,
            sortable: true,
            value: 'name',
          },
          { text: 'Status', 
            sortable: true,
            value: 'status'
          },
          { text: 'Needs Approval', 
            sortable: true,
            value: 'waitingApproval' 
          },
          {
            text: 'Delete User',
            sortable: false,
            value: 'actions',
          }
        ],
        users: [],
        page: 1,
        notif: "",
        snackbar: false,
        id : this.$route.params.adminID
      }
    },
    created(){
      this.id = this.$route.params.adminID
      this.getUserList(); //call when instance is new
    },
    methods: {
      async getUserList(){
        let doc;
        try {
          doc = await firebase.functions().httpsCallable("getAllUsers")({});
          let all_users = doc.data;
          this.users = all_users.filter(all_users => all_users.isAdmin === false);
          this.completionStatus();
        } catch (err) {
          this.displayNotification(err.message);
        }
      },
      completionStatus() {
        for (let i = 0; i < this.users.length; i++) {
          let user = this.users[i];
          let completedCount = 0;
          let awaitingApproval = false;
          let taskReduction = 0
          for (let j = 0; j < user["tasks"].length; j++) {
            let activity = user["tasks"][j]
            if (activity["isApproved"] === true) {
              completedCount += 1
            }
            if (activity["isApproved"] === false && activity["isSubmitted"] === true){
              awaitingApproval = true;
            }
          }
          //if the user is an in school mentor
          if(!user.isCommunityMentor){
            taskReduction = 2;
          }
          user.status = completedCount >= (user["tasks"].length - taskReduction) ? "Completed" : (completedCount + "/" + (user["tasks"].length - taskReduction) + " completed");
          user.waitingApproval = awaitingApproval ? "mdi-alert": "mdi-check-circle";
        }
        return this.users;
      },

      getColor(status) {
        if (status === "Completed") {
          return 'accent'
        }else if (status <= "9/18") {
          return 'red'
        }else{
          return 'inprogress'
        }
      },
      
      goToApplicantView(selectedUser) {
        this.$router.push(`/admin/${this.id}/${selectedUser.id}`)
      },

      displayNotification(message) {
        this.notif = message;
        this.snackbar = true;
        setTimeout(() => { 
          this.snackbar = false; 
        }, 5000);
      }
    },

  }
</script>
<style scoped>
  ::v-deep tbody tr {
    cursor: pointer;
  }
</style>