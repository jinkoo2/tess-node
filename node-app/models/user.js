const mongoose = require('mongoose');
//const bcrypt = require('bcrypt');

//const saltRounds = 10;

const UserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 100
    },

    email: {
      type: String,
      required: true,
      unique: true,
      minlength: 10,
      maxlength: 500
    },

    // not used for now
    password: {
      type: String,
      // required: true,
      minlength: 8,
      maxlength: 500
    },

    type: {
      type: String,
      default: 'user' // user or admin
    },

    // user applications
    apps: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App'
    }],

    settings: {
      type: Object
    },

    active: {
      type: Boolean,
      default: true
    },

    num_reqs: {
      type: Number,
      default: 0
    },

    num_reqs_of_today: {
      type: Number,
      default: 0
    },
    num_reqs_of_this_month: {
      type: Number,
      default: 0
    },
    num_reqs_of_this_year: {
      type: Number,
      default: 0
    },

    num_of_allowed_reqs_per_day: {
      type: Number,
      default: 1000000000000000000
    },

    num_of_allowed_reqs_per_month: {
      type: Number,
      default: 1000000000000000000
    },
    num_of_allowed_reqs_per_year: {
      type: Number,
      default: 1000000000000000000
    },

    num_pages: {
      type: Number,
      default: 0
    },
    num_words: {
      type: Number,
      default: 0
    },
    total_sec: {
      type: Number,
      default: 0
    },
    total_mbyte: {
      type: Number,
      default: 0
    },
  },
  {
    timestamps: true
  }
);

// UserSchema.pre('save', function(next) {
//     ////////////////////////////////////////////////////////////////////
//     // Hash passwrod if this is a new user, or the password has changed, 
//     if (this.isNew || this.isModified('password')) {
//       // Saving reference to this because of changing scopes
//       const document = this;
//       console.log('hasing password')
//       bcrypt.hash(document.password, saltRounds,
//         function(err, hashedPassword) {
//         if (err) {
//           console.error("hasing failed! err=>", err)
//           next(err);
//         }
//         else {
//           document.password = hashedPassword;
//           next();
//         }
//       });
//     } else {
//       next();
//     }
//   });

// UserSchema.methods.isCorrectPassword = function(password, callback){
//   bcrypt.compare(password, this.password, function(err, same) {
//     if (err) {
//       callback(err);
//     } else {
//       callback(err, same);
//     }
//   });
// }

// UserSchema.methods.hashPassword = function(password, callback){
//   bcrypt.hash(password, saltRounds,
//     function(err, hashedPassword) {
//     if (err) {
//       callback(err)
//     }
//     else {
//       callback(err,hashedPassword)
//     }
//    });
// }


module.exports = mongoose.model('User', UserSchema);