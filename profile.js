document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('profile-photo');
    const defaultAvatar = document.getElementById('default-avatar');
    const uploadedImage = document.getElementById('uploaded-image');
    const form = document.querySelector('form');

    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            
            uploadedImage.setAttribute('href', tempUrl);
            
            defaultAvatar.setAttribute('display', 'none');
            uploadedImage.setAttribute('display', 'inline');
        }
    });

    if (form) {
        form.addEventListener('reset', function() {
            defaultAvatar.setAttribute('display', 'inline');
            uploadedImage.setAttribute('display', 'none');
            uploadedImage.setAttribute('href', '');
        });
    }

  const user = localStorage.getItem("user");
  if (user) {
    try {
      const user2 = JSON.parse(user);
      console.log(user2);

      const governorate = document.getElementById("governorate");
      const fullname = document.getElementById("fullname");
      const email = document.getElementById("email");
      const phone = document.getElementById("phone");

      if (governorate) governorate.value = user2.governorate;
      if (email) email.value = user2.email;
      if (fullname) fullname.value = user2.name;
      if (phone) phone.value = user2.phone;
    } catch (e) {
      console.error("Error parsing user data from localStorage", e);
    }

}
});