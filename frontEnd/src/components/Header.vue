<template>
    <v-app-bar
        data-app
        color="primary"
        padding-left="1rem"
        padding-right="1rem"
        flat
        absolute
        elevation="1"
    >
      <v-btn
       icon
       class="mr-4"
       v-if="showBackButton === true"
       @click="goBack()"
       >
       <v-icon>mdi-arrow-left</v-icon>
       </v-btn>
        <v-menu 
          offset-y
          :nudge-width="200"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn 
              icon 
              rounded
              v-on="on"
              v-bind="attrs"
              @click="clearNotification()"
            >
              <v-icon :color="getColor()">{{ seen ? "mdi-bell" : "mdi-bell-alert" }}</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-list>
            <v-list-item>
                <v-list-item-content>
                  <v-list-item-title align="left">Notifications</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn
                    align="right"
                    icon
                  >
                    <v-icon small>mdi-close</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <v-list style="max-height: 200px; overflow-y: scroll">
              <v-list-item 
                v-for="(notification, index) in notifications.slice().reverse()"
                :key="index"
              >
                <v-list-item-content>
                  <v-list-item-subtitle align="left">{{ notification }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
        
        <v-spacer></v-spacer>

        <v-menu
            v-model="menu"
            :close-on-content-click="false"
            :close-on-click="true"
            :nudge-width="200"
            offset-y
        >
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            text
            v-bind="attrs"
            v-on="on"
            rounded 
            elevation="0"
          >
            {{ name }}
            <v-icon right>mdi-account</v-icon>
          </v-btn>
        </template>
  
        <v-card>
          <v-list>
            <v-list-item>
  
              <v-list-item-content>
                <v-list-item-title align="left">Profile Information</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn
                  align="right"
                  icon
                  @click="menu = false"
                >
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>

            <v-divider></v-divider>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-subtitle align="left">{{ name }}</v-list-item-subtitle>
                <v-list-item-subtitle align="left">{{ type }}</v-list-item-subtitle>
                <v-list-item-subtitle align="left">{{ email }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>

        <v-btn 
            text
            rounded
            font-family='Roboto, sans-serif'
            @click="logOut()"
        >
        Log out
        </v-btn>
    </v-app-bar>
</template>

<script>
import firebase from "firebase";

    export default {
        data: () => ({
            menu: false,
            userNotifications: [],
            notifications:[],
            initial: false,
            id: "",
            name: "",
            type: "",
            user: {},
            email: "",
            seen: true,
            showBackButton: false
        }),
        created() {
          this.id = this.$route.params.adminID || this.$route.params.applicantID; // Short circuit assignment
          this.showBackButton = this.$route.params.adminID && this.$route.params.applicantID ? true : false;
          this.getUserInformation();

          this.initial = true;

          let ref = firebase.firestore().collection('users').doc(this.id).collection('notifications');

          //trigger notification everytime users' notification document gets changed
          ref.onSnapshot(snapshot => {
            //ignore initial snapshot
            if (this.initial) {
              this.initial = false;
            } else {
              if (!snapshot.docChanges().empty) { 
                this.$emit("update", null);
                snapshot.docChanges().forEach(change => {
                  let doc = change.doc;
                  this.seen = false;
                  this.notifications.push(doc.data().message + " - " + doc.data().date);
                  this.emitNotification(doc.data().message);
                });
              }
            }
          });
        },
        methods: {
          async getUserInformation() {
            let doc;
            try {
              doc = await firebase.functions().httpsCallable("getUserByID")({
                id: this.id,
              });
            } catch (err) {
              console.log(err.message);
            }
            //get user information
            this.user = doc.data;
            this.name = this.user.name;
            if (this.user.isAdmin === true) {
              this.type = "Administrator";
            } else if (this.user.isCommunityMentor === true) {
              this.type = "Community Mentor";
            } else {
              this.type = "Education Mentor";
            }
            this.email = this.user.email;
            //get notifications for user
            this.getNotifications();
          },
          async getNotifications() {
            let doc;
            try {
              doc = await firebase.functions().httpsCallable("getAllNotifications")({ id: this.id });
              this.userNotifications = doc.data;
            } catch (err) {
              console.log(err.message);
            }
            if (this.userNotifications.length === 0) {
              this.notifications.push("No notifications");
            } else {
              for (let i = 0; i < this.userNotifications.length; i++) {
                let notification = this.userNotifications[i];
                this.notifications.push(notification.message + " - " + notification.date);
              } 
            }
          },
          clearNotification() {
            this.seen = true;
          }, 
          emitNotification(newNotification) {
            this.$emit("newNotif", newNotification);
          },
          getColor() {
            if (this.seen === true) {
              return;
            } else {
              return "accent";
            }
          },
          goBack() {
            this.$router.go(-1);
          },
          logOut() {
            firebase
            .auth().signOut()
            .then(() => {
              this.$router.push(`/`);
            }).catch(function(error) {
              //error block
              console.log(error)
            });
          }
        },
    }
</script>
