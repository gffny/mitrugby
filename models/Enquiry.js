var keystone = require('keystone');
var Types = keystone.Field.Types;

var Enquiry = new keystone.List('Enquiry', {
    nocreate: true,
});

Enquiry.add({
    name: { type: Types.Name, required: true },
    email: { type: Types.Email, required: true },
    phone: { type: String },
    enquiryType: { type: Types.Select, options: [
        { value: 'new-player', label: "New Player" },
        { value: 'match-secretary', label: "Match Secretary" },
        { value: 'sponsorship', label: "Sponsorship" },
        { value: 'equipment', label: "Equipment" },
        { value: 'general', label: "General" },
    ], required: true },
    message: { type: Types.Textarea, required: true },
});

Enquiry.track = true;
Enquiry.defaultSort = '-createdAt';
Enquiry.defaultColumns = 'name, email, enquiryType, createdAt';
Enquiry.register();