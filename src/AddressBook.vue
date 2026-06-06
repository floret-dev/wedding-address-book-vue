<script>
import { ref, reactive } from 'vue';
import { getGuestForm, sendFormView, sendFormLink, submitGuestDetails } from './service';
import 'primeicons/primeicons.css';


const getInitialViewId = () => {
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.substring(1));
  return params.get('viewId');
};

const isDataComplete = data => data.name && data.email && data.streetAddress && data.city && data.state && data.zipCode;
const isAdditionalGuestsComplete = guests => guests.every(guest => guest.name && guest.relationship && guest.ageGroup);

export default {
  name: 'AddressBook',
  data() {
    return {
      viewId: getInitialViewId(),
      defaultErrorMessage: 'Please click the link that was sent to your mobile phone number or enter your phone number below. ' +
          'If you are still having issues reach out to the bride or groom directly.',
      formData: reactive({
        name: '',
        email: '',
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
      }),
      additionalGuests: ref([]),
      isSubmitted: ref(false),
      isLoading: ref(false),
      error: ref(null),
      phoneNumber: ref(''),
      phoneNumberSubmitted: ref(''),
      isSubmitting: ref(false),
      readOnly: ref(false),
    }
  },
  mounted() {
    if (this.viewId) {
      this.isLoading = true;
      getGuestForm(this.viewId).then(data => {
        const { additionalGuests, address, locked, ...initialFormData } = data;
        const details = { ...initialFormData, ...address };
        if (isDataComplete(details)) {
          this.additionalGuests.value = additionalGuests || [];
          this.readOnly = locked;
          this.formData.name = details.name;
          this.formData.email = details.email;
          this.formData.city = details.city;
          this.formData.state = details.state;
          this.formData.zipCode = details.zipCode;
        }
      })
          .then(() => sendFormView(viewId))
          .then(response => {
            console.log('View tracked: ', response)
          })
          .finally(() => this.isLoading = false);
    } else {
      this.error = this.defaultErrorMessage;
    }
  },
  methods: {
    handleGuestChange() {
      const newGuests = [...additionalGuests];
      newGuests[index] = { ...newGuests[index], [field]: value, id: newGuests[index].id };
      this.additionalGuests = newGuests;
    },
    addGuest() {
      if (this.additionalGuests.length < 5) {
        this.additionalGuests = [...this.additionalGuests, { id: String(Math.random()) }];
      }
    },
    removeGuest(index) {
      const newGuests = [...this.additionalGuests];
      newGuests.splice(index, 1);
      this.additionalGuests = newGuests;
    },
    handlePhoneNumberSubmit() {
      console.log('Phone number submitted:', this.phoneNumber);
      this.isSubmitting = true;
      sendFormLink(this.phoneNumber)
          .then(() => { this.phoneNumberSubmitted = true })
          .catch(() => { this.error = 'Failed to send link. Please try again.'; })
          .finally(() => { this.isSubmitting = false; });
    },
    handlePhoneNumberChange(e) {
      this.phoneNumber = e.target.value;
    },
    handleSubmit(e) {
      e.preventDefault();
      if (isDataComplete(this.formData) && isAdditionalGuestsComplete(this.additionalGuests) && !this.isSubmitting) {
        this.isSubmitting = true;
        submitGuestDetails({
          ...this.formData,
          additionalGuests: this.additionalGuests.map(guest => ({ name: guest.name, phone: guest.phone, relationship: guest.relationship, ageGroup: guest.ageGroup })),
          viewId: this.viewId
        }).then(response => {
          console.log('Guest details submitted: ', response);
          this.isSubmitted = true;
        }).catch(() => {
          this.error = 'Failed to submit guest details. Please try again.';
        })
        .finally(() => {
          this.isSubmitting = false;
        })
      }
    }
  }
}
</script>

<template>
<div class="App">
  <div v-if="error" class="address-form-container">
    <div class="error-message submitted" v-if="phoneNumberSubmitted">
      <h2>Thank You!</h2>
      <p>A new link has been sent to your mobile phone. Please check your messages.</p>
    </div>
    <div v-else class="error-message">
      <h2>Access Denied</h2>
      <p>{{ error }}</p>
      <div class="form-group">
        <label for="phoneNumber">Phone Number</label>
        <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            :value="phoneNumber"
            @change="handlePhoneNumberChange"
        />
      </div>
      <div class="form-group no-margin">
        <button @click="handlePhoneNumberSubmit" :disabled="isSubmitting">
          <span v-if="isSubmitting">
            <span class="btn-spinner" />Submitting…
          </span>
          <span v-else>Submit</span>
        </button>
      </div>
    </div>
  </div>
  <div v-else-if="isSubmitted" class="address-form-container">
    <div class="confirmation-message">
      <h2>Thank you, {{formData.name}}!</h2>
      <p>Your address has been successfully added to our address book. We hope to see you September 30th!</p>
      <p class="confirmation-deadline">You have until <strong>April 30ht</strong> to finalize your address details and additional guest list. After that date, no further updates will be accepted.</p>
    </div>
  </div>
  <div v-else-if="isLoading" class="address-form-container">
    <div class="loading-message">
      <div class="loading-spinner"></div>
      <p>Verifying your invitation link...</p>
    </div>
  </div>
  <div v-else class="address-form-container">
    <form @submit="handleSubmit" class="address-form">
      <div class="form-header">
        <h2>Join the Celebration!</h2>
        <p>We're so excited to celebrate with you. Please enter your address so we can send you an invitation to our wedding.</p>
        <p>With love,</p>
        <p>Christopher & Soni-kay Thaw</p>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="name">First and Last name</label>
          <input
            type="text"
            id="name"
            name="name"
            :value="formData.name"
            @change="e => formData.name = e.target.value"
            :readOnly="readOnly"
            required
          />
        </div>
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input
            type="email"
            id="email"
            name="email"
            :value="formData.email"
            @change="e => formData.email = e.target.value"
            :readonly="readOnly"
            required
        />
      </div>
      <div class="form-group">
        <label for="streetAddress">Street Address</label>
        <input
            type="text"
            id="streetAddress"
            name="streetAddress"
            :value="formData.streetAddress"
            @change="e => formData.streetAddress = e.target.value"
            :readonly="readOnly"
            required
        />
      </div>
      <div class="form-group">
        <label for="apartment">Apartment, suite, etc. (optional)</label>
        <input
            type="text"
            id="apartment"
            name="apartment"
            :value="formData.apartment"
            @change="e => formData.apartment = e.target.value"
            :readonly="readOnly"
        />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="city">City</label>
          <input
              type="text"
              id="city"
              name="city"
              :value="formData.city"
              @change="e => formData.city = e.target.value"
              :readonly="readOnly"
              required
          />
        </div>
        <div class="form-group">
          <label for="state">State</label>
          <input
              type="text"
              id="state"
              name="state"
              :value="formData.state"
              @change="e => formData.state = e.target.value"
              :readonly="readOnly"
              required
          />
        </div>
        <div class="form-group">
          <label for="zipCode">Zip Code</label>
          <input
              type="text"
              id="zipCode"
              name="zipCode"
              :value="formData.zipCode"
              @change="e => formData.zipCode = e.target.value"
              :readonly="readOnly"
              required
          />
        </div>
      </div>
      <div class="plus-ones-section">
        <h3>Additional Guests</h3>
        <p>Please enter the full name of each guest that will be attending with you.</p>
        <p class="guest-note">Use this section to include additional family members — such as children, parents, or close friends — who may not have received their own invite link. Please note that <strong>all added guests are subject to approval by the bride and groom</strong>. You can track the approval status of your guests through a link that will be sent to your phone after submission.</p>
        <div v-for="(guest, index) in additionalGuests" :key="guest.id" class="guest-input">
          <div class="guest-fields">
            <input
                type="text"
                placeholder="First and Last name"
                :value="guest.name || ''"
            @change="(e) => handleGuestChange(index, 'name', e.target.value)"
            :readonly="readOnly"
            />
            <input
                type="tel"
                placeholder="Phone number (optional)"
                :value="guest.phone || ''"
            @change="(e) => handleGuestChange(index, 'phone', e.target.value)"
            :readonly="readOnly"
            />
            <select
                :value="guest.relationship || ''"
            @change="(e) => handleGuestChange(index, 'relationship', e.target.value)"
            class="guest-select"
            :disabled="readOnly"
            >
              <option value="" disabled>Select Relationship</option>
              <option value="SPOUSE">Immediate Family — Spouse</option>
              <option value="CHILD">Immediate Family — Child</option>
              <option value="SIBLING">Immediate Family — Sibling</option>
              <option value="SIGNIFICANT_OTHER">Significant Other</option>
              <option value="EXTENDED">Extended Family</option>
              <option value="FRIEND">Close Friend</option>
            </select>
            <select
              :value="guest.ageGroup || ''"
              @change="(e) => handleGuestChange(index, 'ageGroup', e.target.value)"
              class="guest-select"
              :disabled="readOnly"
            >
              <option value="" disabled>Select Age Group</option>
              <option value="0_5">Age 0–5</option>
              <option value="6_12">Age 6–12</option>
              <option value="13_19">Age 13–19</option>
              <option value="20up">Age 20+</option>
            </select>
          </div>
          <span v-if="readOnly" class="pending-icon pi pi-clock" title="Pending approval"></span>
          <button v-else type="button" @click="() => removeGuest(index)" aria-label="Remove guest">
            <span class="pi pi-trash"></span>
          </button>
        </div>
        <button v-if="!readOnly && additionalGuests.length < 5" type="button" @click="addGuest">Add Guest</button>
      </div>
      <button type="submit" :disabled="isSubmitting">
        <span v-if="isSubmitting"><span class="btn-spinner" />Submitting…</span>
        <span v-else>Submit</span>
      </button>
    </form>
  </div>
</div>
</template>

<style lang="css">

:root {
  --text: #6b6375;
  --text-h: #08060d;
  --bg: #fff;
  --border: #e5e4e7;
  --code-bg: #f4f3ec;
  --accent: #aa3bff;
  --accent-bg: rgba(170, 59, 255, 0.1);
  --accent-border: rgba(170, 59, 255, 0.5);
  --social-bg: rgba(244, 243, 236, 0.5);
  --shadow: rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px;

  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, Consolas, monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  --primary-color: #6a0dad;
  --secondary-color: #f3e5f5;
  --accent-color: #ffd700;
  --text-color: #333;
  --bg-color: var(--bg);
  --border-color: #e0e0e0;
  --error-color: #d32f2f;
  --success-color: #388e3c;

  font: 18px/145% var(--sans);
  letter-spacing: 0.18px;
  color: var(--text);
  background: var(--bg);
  font-synthesis: none;
  text-rendering: optimizeLegibility;

  @media (max-width: 1024px) {
    font-size: 16px;
  }
}

body {
  margin: 0;
}

#root {
  width: 1126px;
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

h1,
h2 {
  font-family: var(--heading);
  font-weight: 500;
  color: var(--text-h);
}

h1 {
  font-size: 56px;
  letter-spacing: -1.68px;
  margin: 32px 0;
  @media (max-width: 1024px) {
    font-size: 36px;
    margin: 20px 0;
  }
}
h2 {
  font-size: 24px;
  line-height: 118%;
  letter-spacing: -0.24px;
  margin: 0 0 8px;
  @media (max-width: 1024px) {
    font-size: 20px;
  }
}
p {
  margin: 0;
}

code,
.counter {
  font-family: var(--mono);
  display: inline-flex;
  border-radius: 4px;
  color: var(--text-h);
}

code {
  font-size: 15px;
  line-height: 135%;
  padding: 4px 8px;
  background: var(--code-bg);
}

.address-form-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: var(--bg-color);
}

.address-form {
  width: 100%;
  max-width: 600px;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: var(--bg-color);
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.couple-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
}

.form-header h2 {
  color: pink;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.form-header p {
  color: var(--text-color);
  font-size: 1rem;
  line-height: 1.5;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: bold;
}

.form-group input, .guest-input input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-color);
  color: var(--text-color);
  box-sizing: border-box;
}

input[readonly],
input:read-only {
  background-color: var(--secondary-color);
  cursor: default;
  color: var(--text-color);
  opacity: 0.85;
}

select:disabled {
  background-color: var(--secondary-color);
  cursor: default;
  opacity: 0.85;
}

button, button[type="submit"] {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 4px;
  background-color: var(--accent-color);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

button[type="submit"] {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--text-color);
  font-size: 1rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 4px solid var(--secondary-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.confirmation-message {
  padding: 2rem;
  background-color: var(--secondary-color);
  border-radius: 8px;
}

.confirmation-message h2 {
  color: var(--primary-color);
  font-size: 2rem;
  margin-bottom: 1rem;
}

.confirmation-message p {
  color: var(--text-color);
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.confirmation-deadline {
  font-size: 0.95rem !important;
  color: #555 !important;
  background-color: #fff8e1;
  border-left: 3px solid #f9a825;
  padding: 0.65rem 1rem;
  border-radius: 4px;
  margin-top: -0.5rem;
}

.confirmation-message button {
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  background-color: var(--accent-color);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  background-color: var(--secondary-color);
  border: 1px solid var(--error-color);
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
}

.error-message.submitted {
  border-color: var(--success-color);
}

.error-message h2 {
  color: var(--error-color);
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-message.submitted h2 {
  color: var(--success-color);
}

.error-message p {
  color: var(--text-color);
  font-size: 1.2rem;
  margin-bottom: 2rem;
  max-width: 400px;
}

.error-message .form-group {
  width: 100%;
  max-width: 400px;
  margin-bottom: 1.5rem;
}

.plus-ones-section {
  margin-top: 2rem;
  border-top: 1px solid var(--border-color);
  padding-top: 2rem;
  margin-bottom: 1rem;
}

.plus-ones-section h3 {
  color: pink;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.plus-ones-section p {
  color: var(--text-color);
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.guest-note {
  font-size: 0.9rem !important;
  color: #666 !important;
  background-color: var(--secondary-color);
  border-left: 3px solid var(--primary-color);
  padding: 0.75rem 1rem;
  border-radius: 4px;
}

.guest-input {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.guest-input + .guest-input {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.guest-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.guest-input input {
  flex: 1;
}

.guest-select {
  width: 100%;
  padding: 0.75rem;
  padding-right: 2.25rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-color);
  color: var(--text-color);
  box-sizing: border-box;
  font-size: .8rem;
  font-family: inherit;
  line-height: inherit;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
}

.guest-select option {
  color: var(--text-color);
  background-color: var(--bg-color);
  font-size: 1rem;
  font-family: inherit;
}

.guest-input button {
  width: auto;
  padding: 0.5rem 1rem;
  background-color: var(--error-color);
}

.remove-guest-btn {
  width: 2.25rem !important;
  height: 2.25rem !important;
  min-width: 2.25rem;
  padding: 0 !important;
  border-radius: 50% !important;
  background-color: var(--error-color) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plus-ones-section button {
  width: auto;
  padding: 0.75rem 1.5rem;
}

.pending-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: #b8860b;
  font-size: 1.1rem;
  flex-shrink: 0;
  animation: spin 2s linear infinite;
}

.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;

  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.hero {
  position: relative;

  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }

  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }

  .framework,
  .vite {
    position: absolute;
  }

  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
    scale(1.4);
  }

  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
    scale(0.8);
  }
}

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;

  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}

#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;

  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }

  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}

#docs {
  border-right: 1px solid var(--border);

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;

  .logo {
    height: 18px;
  }

  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }

  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;

    li {
      flex: 1 1 calc(50% - 8px);
    }

    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}

#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}

.ticks {
  position: relative;
  width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .address-form {
    padding: 1.5rem;
  }

  .form-header h2 {
    font-size: 1.5rem;
  }
}
</style>
