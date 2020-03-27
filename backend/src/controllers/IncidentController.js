const connection = require('../database/connection');
const num_record = 5;
module.exports = {

    async index(request, response) {
        const { page = 1 } = request.query;

        const [count] = await connection('incidents').count();

        const ongs = await connection('incidents')
            .join('ongs', 'ongs.id','=','incidents.ong_id')
            .limit(num_record)
            .offset( (page - 1) * num_record)            
            .select([
                'incidents.*', 
                'ongs.name', 
                'ongs.email', 
                'ongs.whatsapp', 
                'ongs.city', 
                'ongs.uf'
            ]);
    
        response.header('X-Total-Count', count['count(*)']);        
        response.header('X-Total-Page', Math.ceil( count['count(*)']/num_record ));
        response.header('X-Current-Page', page);
        return response.json(ongs);
    },
    
    async create( request, response) {
        const { title, description, value } = request.body;
        const ong_id = request.headers.authorization;
        
        const [id] = await connection('incidents').insert({
            title,
            description,
            value,
            ong_id
        });
    
        return response.json( { id } );
    },

    async delete (request, response) {
        const { id } = request.params;
        const ong_id = request.headers.authorization;
        
        const incident = await connection('incidents')
            .where('id',id)
            .select('ong_id')
            .first();
    
        if (incident.ong_id !== ong_id) {
            return response.status(401).json({ error: 'Operation not permitted.'});
        }

        await connection('incidents').where('id', id).delete();

        return response.status(204).send();
    }
};