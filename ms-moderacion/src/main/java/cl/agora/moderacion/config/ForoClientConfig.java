package cl.agora.moderacion.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** Cliente HTTP hacia ms-foro con su URL base y tiempos de espera. */
@Configuration
public class ForoClientConfig {

    @Bean
    RestClient foroRestClient(RestClient.Builder builder,
                              @Value("${app.foro.url}") String foroUrl,
                              @Value("${app.foro.timeout-ms:5000}") int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        return builder.baseUrl(foroUrl).requestFactory(factory).build();
    }
}
