window.CalendarDB = {

    async getEvents() {
        const {
    data,
    error
} =
await supabase
.from("calendar_events")
.select("*")
.order("starts_at");

    },

    async createEvent(event) {

    },

    async updateEvent(id, event) {

    },

    async deleteEvent(id) {

    }

};