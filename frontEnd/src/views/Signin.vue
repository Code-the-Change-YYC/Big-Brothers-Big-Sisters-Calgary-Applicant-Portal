<template>
  <v-container
    fluid
    style="
      margin: 0 auto 0 auto;
      padding: 0px;
      max-width: 800px;
      width: 90% !important;
    "
  >
    <v-card>
      <bbbs-logo></bbbs-logo>
      <v-card-title align-middle class="center accent white--text">
        Sign In
      </v-card-title>
      <form>
        <v-container fluid style="margin: 0 auto 0 auto">
          <v-row justify="center">
            <v-col cols="12" sm="10">
              <v-text-field
                v-model="email"
                placeholder="first.last@email.com"
                label="Email"
                outlined
                required
                color="accent"
                :error-messages="errormessage"
              ></v-text-field>
              <v-text-field
                v-model="password"
                placeholder="******"
                label="Password"
                outlined
                required
                color="accent"
                :append-icon="passwordVisible ? 'mdi-eye' : 'mdi-eye-off'"
                :type="passwordVisible ? 'text' : 'password'"
                name="input-10-2"
                hint="At least 8 characters"
                :error-messages="errormessage"
                @click:append="passwordVisible = !passwordVisible"
                @keydown.enter="auth(email, password)"
              ></v-text-field>
              <v-row justify="space-around">
                <v-col>
                  <v-btn
                    color="accent"
                    width="100%"
                    @click="auth(email, password)"
                  >
                    Sign in
                  </v-btn>
                </v-col>
              </v-row>
              <v-row justify="space-around">
                <v-col>
                  <v-btn
                    width="100%"
                    color="accent"
                    margin-bottom="1em"
                    @click="$router.push('/forgot')"
                  >
                    Forgot Password
                  </v-btn>
                </v-col>
              </v-row>
              <v-row justify="space-around">
                <v-col>
                  <v-btn
                    width="100%"
                    color="accent"
                    margin-bottom="1em"
                    @click="$router.push('/signup')"
                  >
                    Dont have an account? Sign Up
                  </v-btn>
                </v-col>
              </v-row>
              <!-- </v-col> -->
              <!-- </v-row> -->
              <v-col>
                <v-btn
                  color="accent"
                  margin-bottom="1em"
                  @click="auth('final@test.com', 'Abc1234$')"
                >
                  BYPASS AUTH AS APPLICANT (DEBUG ONLY)
                </v-btn>
              </v-col>
              <v-col>
                <v-btn
                  color="accent"
                  margin-bottom="1em"
                  @click="auth('cole.t@abc.com', 'Abc1234$')"
                >
                  BYPASS AUTH AS ADMIN (DEBUG ONLY)
                </v-btn>
              </v-col>
            </v-col>
          </v-row>
        </v-container>
      </form>
    </v-card>
  </v-container>
</template>

<script>
import Logo from "../components/Logo";
import firebase from "firebase";

export default {
  name: "Signin",
  data() {
    return {
      email: "",
      password: "",
      passwordVisible: false,
      errormessage: "",
    };
  },
  components: {
    "bbbs-logo": Logo,
  },
  methods: {
    async auth(email, password) {
      let id;
      try {
        let user = await firebase
          .auth()
          .signInWithEmailAndPassword(email, password);
        id = user.user.uid;
      } catch (err) {
        this.errormessage = "The email or password is incorrect";
      }

      let doc;
      try {
        doc = await firebase.functions().httpsCallable("getUserByID")({ id });
        let currentUser = doc.data;
         if(currentUser.isAdmin) {
            this.$router.push(`admin/home/${id}`)
          }else if(!currentUser.isAdmin){
            this.$router.push(`applicant/${id}`)
          }
      } catch (err) {
        this.errormessage = err;
      }
    },
  },
};
</script>

<style scoped>
.v-text-field--outlined >>> fieldset {
  border-color: #2dccd3 !important;
  border-width: medium !important;
}
</style>